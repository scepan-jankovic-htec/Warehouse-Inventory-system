# Category Feature — Quick Implementation Reference

## Component: CategoryListComponent

**Location:** `frontend/src/app/features/categories/pages/category-list/category-list.component.ts`

### Key Features Highlights

#### 1. Real-Time Search (Debounced)
```typescript
private searchSubject = new Subject<string>();

onSearchChange(event: Event) {
  const value = (event.target as HTMLInputElement).value;
  this.searchQuery.set(value);
  this.searchSubject.next(value);
}

ngOnInit() {
  this.searchSubject.pipe(debounceTime(300)).subscribe(() => {
    this.currentPage.set(1);  // Reset to page 1 on search
  });
}
```

#### 2. Computed Filtering (Client-Side)
```typescript
filteredCategories = computed(() => {
  const all = this.categories$;
  const search = this.searchQuery().toLowerCase();
  const activeOnlyFilter = this.activeOnly();
  
  let filtered = all.filter(cat => {
    const matchesSearch = search === '' || cat.name.toLowerCase().includes(search);
    const matchesActive = !activeOnlyFilter || cat.active;
    return matchesSearch && matchesActive;
  });
  
  // Then sort
  filtered.sort((a, b) => {
    const sortField = this.sortBy();
    let aVal: any = sortField === 'name' ? a.name : new Date(a.createdAt).getTime();
    let bVal: any = sortField === 'name' ? b.name : new Date(b.createdAt).getTime();
    
    const comparison = typeof aVal === 'string'
      ? aVal.localeCompare(bVal)
      : aVal - bVal;
    
    return this.sortDir() === 'asc' ? comparison : -comparison;
  });
  
  return filtered;
});
```

#### 3. Pagination
```typescript
paginatedCategories = computed(() => {
  const filtered = this.filteredCategories();
  const start = (this.currentPage() - 1) * this.pageSize();
  const end = start + this.pageSize();
  return filtered.slice(start, end);
});

previousPage() {
  if (this.currentPage() > 1) {
    this.currentPage.update(p => p - 1);
  }
}

nextPage() {
  if (this.currentPage() < this.totalPages()) {
    this.currentPage.update(p => p + 1);
  }
}
```

#### 4. Toggle Activate/Deactivate
```typescript
toggleActive(category: CategoryResponse) {
  const operation = category.active
    ? this.categoryService.deactivateCategory(category.id)
    : this.categoryService.activateCategory(category.id);

  operation.subscribe({
    next: () => {
      this.errorMessage.set('');  // Clear error on success
    },
    error: (err) => {
      this.errorMessage.set(`Failed to ${category.active ? 'deactivate' : 'activate'} category`);
      console.error('Error toggling status:', err);
    }
  });
}
```

#### 5. Template Binding Examples
```html
<!-- Search Input -->
<input
  type="text"
  placeholder="Search by name..."
  [value]="searchQuery()"
  (input)="onSearchChange($event)"
  class="search-input"
/>

<!-- Status Badge -->
<span class="badge" [ngClass]="{ 
  'badge-active': category.active, 
  'badge-inactive': !category.active 
}">
  {{ category.active ? 'Active' : 'Inactive' }}
</span>

<!-- Sortable Header -->
<th class="sortable-header" (click)="toggleSort('name')">
  Name
  <span class="sort-indicator">{{ getSortIndicator('name') }}</span>
</th>

<!-- Pagination -->
<button [disabled]="currentPage() <= 1" (click)="previousPage()">
  ← Previous
</button>
<span>Page {{ currentPage() }} of {{ totalPages() }}</span>
<button [disabled]="currentPage() >= totalPages()" (click)="nextPage()">
  Next →
</button>
```

---

## Component: CategoryFormComponent

**Location:** `frontend/src/app/features/categories/pages/category-form/category-form.component.ts`

### Key Features Highlights

#### 1. Dual-Mode Initialization
```typescript
ngOnInit() {
  this.route.params.subscribe(params => {
    if (params['id']) {
      this.categoryId = Number(params['id']);
      this.isEditMode.set(true);
      this.loadCategory(this.categoryId);  // Pre-populate form
    }
  });
}

private loadCategory(id: number) {
  this.categoryService.loadCategory(id).subscribe({
    next: (res) => {
      const category = res.data;
      this.form.patchValue({
        name: category.name,
        description: category.description || ''
      });
    },
    error: (err) => {
      this.formError.set('Failed to load category');
      setTimeout(() => this.router.navigate(['/categories']), 2000);
    }
  });
}
```

#### 2. Form Setup with Validators
```typescript
this.form = this.formBuilder.group({
  name: [
    '',
    [Validators.required, Validators.maxLength(100)]
  ],
  description: [
    '',
    [Validators.maxLength(500)]
  ]
});
```

#### 3. Form Submission (Create)
```typescript
onSubmit() {
  if (this.form.invalid) return;

  this.isSubmitting.set(true);
  this.formError.set('');
  this.successMessage.set('');

  const formValue = this.form.value;

  if (!this.isEditMode()) {
    // Create mode
    this.categoryService.createCategory(formValue).subscribe({
      next: () => {
        this.successMessage.set('Category created successfully');
        setTimeout(() => this.router.navigate(['/categories']), 1500);
      },
      error: (err) => {
        this.isSubmitting.set(false);
        if (err.status === 409) {
          this.formError.set('This category name is already in use');
        } else {
          this.formError.set('Failed to create category. Please try again.');
        }
      }
    });
  } else {
    // Update mode (similar pattern)
    this.categoryService.updateCategory(this.categoryId, formValue).subscribe({
      // ...
    });
  }
}
```

#### 4. Form Validation Display
```html
<!-- Name Field with Errors -->
<div class="form-group">
  <label for="name">
    Category Name <span class="required">*</span>
  </label>
  <input
    id="name"
    type="text"
    formControlName="name"
    placeholder="e.g., Beverages"
    maxlength="100"
  />
  <div *ngIf="name.touched && name.invalid" class="error-message">
    <span *ngIf="name.errors?.['required']">Name is required</span>
    <span *ngIf="name.errors?.['maxlength']">Cannot exceed 100 characters</span>
  </div>
</div>

<!-- Description with Character Counter -->
<div class="form-group">
  <label for="description">
    Description <span class="optional">(optional)</span>
  </label>
  <textarea
    id="description"
    formControlName="description"
    placeholder="e.g., All drinkable products"
    rows="4"
    maxlength="500"
  ></textarea>
  <div class="char-count">
    {{ (description.value?.length || 0) }} / 500
  </div>
</div>

<!-- Submit Button -->
<button
  type="submit"
  [disabled]="form.invalid || isSubmitting()"
  class="btn btn-primary"
>
  {{ isSubmitting() ? '⏳ Saving...' : 'Create' }}
</button>
```

#### 5. Error Handling
```html
<!-- Error Banner -->
<div *ngIf="formError()" class="error-banner">
  ❌ {{ formError() }}
</div>

<!-- Success Banner -->
<div *ngIf="successMessage()" class="success-banner">
  ✅ {{ successMessage() }}
</div>
```

---

## Service: CategoryService Updates

**Location:** `frontend/src/app/features/categories/services/category.service.ts`

### Key Changes

#### 1. loadCategories Now Returns Observable
```typescript
// Before: return type was void
loadCategories(params: CategoryListParams = {}): Observable<PagedResponse<CategoryResponse>> {
  this._isLoading.set(true);
  return this.getCategories(params).pipe(
    tap((res) => {
      this._categories.set(res.data);
      this._totalElements.set(res.pagination.totalElements);
      this._totalPages.set(res.pagination.totalPages);
      this._currentPage.set(res.pagination.page);
      this._isLoading.set(false);
    })
  );
}
```

#### 2. loadCategory Now Returns Observable
```typescript
// Before: return type was void
loadCategory(id: number): Observable<ApiResponse<CategoryResponse>> {
  this._isLoading.set(true);
  return this.getCategory(id).pipe(
    tap((res) => {
      this._selectedCategory.set(res.data);
      this._isLoading.set(false);
    })
  );
}
```

#### 3. Usage in Components
```typescript
// Component can now handle errors via subscription
this.categoryService.loadCategories({
  page: 1,
  size: 100,
  sortBy: 'name',
  sortDir: 'asc'
}).subscribe({
  next: (res) => { /* Success */ },
  error: (err) => { /* Handle error */ }
});
```

---

## Template Patterns

### Status Badge
```html
<span class="badge" [ngClass]="{ 'badge-active': category.active, 'badge-inactive': !category.active }">
  {{ category.active ? 'Active' : 'Inactive' }}
</span>
```

**Styling:**
```css
.badge {
  display: inline-block;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.badge-active {
  background: #e8f5e9;
  color: #2e7d32;
}

.badge-inactive {
  background: #fff3e0;
  color: #e65100;
}
```

### Sort Indicator
```html
<th class="sortable-header" (click)="toggleSort('name')">
  Name
  <span class="sort-indicator">{{ getSortIndicator('name') }}</span>
</th>
```

**Implementation:**
```typescript
getSortIndicator(field: string): string {
  if (this.sortBy() !== field) return '';
  return this.sortDir() === 'asc' ? '↑' : '↓';
}
```

### Empty State
```html
<div *ngIf="!isLoading() && filteredCategories().length === 0" class="empty-state">
  <p>No categories found</p>
  <button class="btn btn-secondary" (click)="createNew()">
    Create your first category
  </button>
</div>
```

### Loading State
```html
<div *ngIf="isLoading()" class="loading-spinner">
  ⏳ Loading categories...
</div>
```

### Error Banner
```html
<div *ngIf="errorMessage()" class="error-banner">
  ❌ {{ errorMessage() }}
</div>
```

---

## Computed Signal Pattern

```typescript
// Simple computed (derived from one signal)
activeCategories = computed(() =>
  this._categories().filter((c) => c.active)
);

// Complex computed (depends on multiple signals and business logic)
filteredCategories = computed(() => {
  const all = this.categories$;
  const search = this.searchQuery().toLowerCase();
  const activeOnlyFilter = this.activeOnly();
  const sortField = this.sortBy();
  const sortDirection = this.sortDir();

  // Filter
  let filtered = all.filter(cat => {
    const matchesSearch = search === '' || cat.name.toLowerCase().includes(search);
    const matchesActive = !activeOnlyFilter || cat.active;
    return matchesSearch && matchesActive;
  });

  // Sort
  filtered.sort((a, b) => {
    let aVal: any = sortField === 'name' ? a.name : new Date(a.createdAt).getTime();
    let bVal: any = sortField === 'name' ? b.name : new Date(b.createdAt).getTime();

    const comparison = typeof aVal === 'string'
      ? aVal.localeCompare(bVal)
      : aVal - bVal;

    return sortDirection === 'asc' ? comparison : -comparison;
  });

  return filtered;
});

// Chained computed (depends on another computed signal)
paginatedCategories = computed(() => {
  const filtered = this.filteredCategories();  // Depends on previous computed
  const start = (this.currentPage() - 1) * this.pageSize();
  const end = start + this.pageSize();
  return filtered.slice(start, end);
});
```

---

## Error Handling Pattern

```typescript
// In component
toggleActive(category: CategoryResponse) {
  const operation = category.active
    ? this.categoryService.deactivateCategory(category.id)
    : this.categoryService.activateCategory(category.id);

  operation.subscribe({
    next: () => {
      // Success: clear error message
      this.errorMessage.set('');
    },
    error: (err) => {
      // Map HTTP status to user-friendly message
      if (err.status === 409) {
        this.errorMessage.set('Category name already in use');
      } else if (err.status === 404) {
        this.errorMessage.set('Category not found');
      } else if (err.status === 422) {
        this.errorMessage.set('Category is already in this state');
      } else {
        this.errorMessage.set('Failed to update category status');
      }
      console.error('Error:', err);
    }
  });
}
```

---

## TypeScript Signal Patterns

### Signal Update
```typescript
// Simple set
searchQuery.set('beverages');

// Update based on current value
currentPage.update(p => p + 1);

// Conditional update
activeOnly.update(v => !v);
```

### Signal Getters
```typescript
// In template
<div>{{ searchQuery() }}</div>

// In component
const query = this.searchQuery();

// In getter (defers access to after constructor)
get categories$() {
  return this.categoryService.categories;
}
```

### AsReadonly Pattern
```typescript
// In service
readonly categories = this._categories.asReadonly();
readonly isLoading = this._isLoading.asReadonly();

// In component
isLoading = this.categoryService.isLoading;
// Now component can call isLoading() but can't modify it
```

---

## Event Handling Patterns

### Input Event
```html
<!-- Capture input value -->
<input
  [value]="searchQuery()"
  (input)="onSearchChange($event)"
/>
```

```typescript
onSearchChange(event: Event) {
  const value = (event.target as HTMLInputElement).value;
  this.searchQuery.set(value);
  this.searchSubject.next(value);
}
```

### Click Event
```html
<!-- Simple click -->
<button (click)="createNew()">New Category</button>

<!-- Click with data -->
<button (click)="editCategory(category)">Edit</button>

<!-- Click with condition -->
<button [disabled]="form.invalid" (click)="onSubmit()">Save</button>
```

### Change Event (Checkbox)
```html
<input
  type="checkbox"
  [checked]="activeOnly()"
  (change)="toggleActiveFilter()"
/>
```

---

## Form Patterns

### Reactive Form Setup
```typescript
this.form = this.formBuilder.group({
  name: ['', [Validators.required, Validators.maxLength(100)]],
  description: ['', [Validators.maxLength(500)]]
});
```

### Form Control Access
```typescript
// Via getter
get name() {
  return this.form.get('name')!;
}

// Via direct access
this.form.get('name')?.valueChanges;

// Check state
this.name.touched
this.name.invalid
this.name.errors?.['required']
```

### Form Data Extraction
```typescript
// Get all values
const formValue = this.form.value;  // { name: 'Beverages', description: '...' }

// Pre-populate
this.form.patchValue({
  name: 'Beverages',
  description: 'Drinks'
});
```

---

## Debugging Tips

### Console Logging Signals
```typescript
// Subscribe to signal changes
effect(() => {
  console.log('Search query changed:', this.searchQuery());
});

// In template (development only)
{{ searchQuery() | json }}
```

### Check Form State
```typescript
console.log('Form value:', this.form.value);
console.log('Form errors:', this.form.errors);
console.log('Name errors:', this.name.errors);
console.log('Form valid:', this.form.valid);
console.log('Name touched:', this.name.touched);
```

### Test Signal Updates
```typescript
// Change signal and verify computed updates
this.searchQuery.set('test');
setTimeout(() => {
  console.log('Filtered:', this.filteredCategories());
}, 100);
```

---

**Reference Document Version:** 1.0  
**Last Updated:** 2026-08-01
