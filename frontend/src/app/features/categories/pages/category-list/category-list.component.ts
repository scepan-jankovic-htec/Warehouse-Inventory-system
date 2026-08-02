import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { debounceTime, Subject } from 'rxjs';
import { CategoryService } from '../../services/category.service';
import { CategoryResponse } from '../../models/category.model';

@Component({
  selector: 'app-category-list',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="category-list-container">
      <!-- Header -->
      <div class="list-header">
        <h1>Categories</h1>
        <button class="btn btn-primary" (click)="createNew()">
          ➕ New Category
        </button>
      </div>

      <!-- Filter and Search -->
      <div class="filter-bar">
        <div class="search-group">
          <input
            type="text"
            placeholder="Search by name..."
            [value]="searchQuery()"
            (input)="onSearchChange($event)"
            class="search-input"
          />
        </div>
        <div class="filter-group">
          <label class="checkbox-label">
            <input
              type="checkbox"
              [checked]="activeOnly()"
              (change)="toggleActiveFilter()"
              class="checkbox"
            />
            <span>Active only</span>
          </label>
        </div>
      </div>

      <!-- Loading State -->
      <div *ngIf="isLoading()" class="loading-spinner">
        ⏳ Loading categories...
      </div>

      <!-- Empty State -->
      <div *ngIf="!isLoading() && filteredCategories().length === 0" class="empty-state">
        <p>No categories found</p>
        <button class="btn btn-secondary" (click)="createNew()">
          Create your first category
        </button>
      </div>

      <!-- Categories Table -->
      <div *ngIf="!isLoading() && filteredCategories().length > 0" class="table-container">
        <table class="table">
          <thead>
            <tr>
              <th class="sortable-header" (click)="toggleSort('name')">
                Name
                <span class="sort-indicator">{{ getSortIndicator('name') }}</span>
              </th>
              <th>Description</th>
              <th class="sortable-header" (click)="toggleSort('createdAt')">
                Created
                <span class="sort-indicator">{{ getSortIndicator('createdAt') }}</span>
              </th>
              <th class="numeric">Products</th>
              <th class="center">Status</th>
              <th class="center">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let category of paginatedCategories()">
              <td class="bold">{{ category.name }}</td>
              <td class="truncate">{{ category.description || '—' }}</td>
              <td class="small">{{ formatDate(category.createdAt) }}</td>
              <td class="numeric">{{ category.productCount }}</td>
              <td class="center">
                <span
                  class="badge"
                  [ngClass]="{ 'badge-active': category.active, 'badge-inactive': !category.active }"
                >
                  {{ category.active ? 'Active' : 'Inactive' }}
                </span>
              </td>
              <td class="center">
                <button
                  class="btn btn-sm btn-secondary"
                  (click)="editCategory(category)"
                  title="Edit category"
                >
                  ✏️
                </button>
                <button
                  class="btn btn-sm"
                  [ngClass]="{ 'btn-warning': category.active, 'btn-success': !category.active }"
                  (click)="toggleActive(category)"
                  [title]="category.active ? 'Deactivate' : 'Activate'"
                >
                  {{ category.active ? '🔴' : '🟢' }}
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div *ngIf="!isLoading() && filteredCategories().length > 0" class="pagination-container">
        <button
          class="btn btn-secondary"
          (click)="previousPage()"
          [disabled]="currentPage() <= 1"
        >
          ← Previous
        </button>
        <span class="pagination-info">
          Page {{ currentPage() }} of {{ totalPages() }}
          ({{ filteredCategories().length }} total)
        </span>
        <button
          class="btn btn-secondary"
          (click)="nextPage()"
          [disabled]="currentPage() >= totalPages()"
        >
          Next →
        </button>
      </div>

      <!-- Error Message -->
      <div *ngIf="errorMessage()" class="error-banner">
        ❌ {{ errorMessage() }}
      </div>
    </div>
  `,
  styles: `
    .category-list-container {
      padding: 24px;
      max-width: 1200px;
      margin: 0 auto;
    }

    .list-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
    }

    .list-header h1 {
      margin: 0;
      font-size: 28px;
      font-weight: 600;
      color: #333;
    }

    .filter-bar {
      display: flex;
      gap: 16px;
      margin-bottom: 24px;
      align-items: center;
      flex-wrap: wrap;
    }

    .search-group {
      flex: 1;
      min-width: 250px;
    }

    .search-input {
      width: 100%;
      padding: 10px 12px;
      border: 1px solid #ddd;
      border-radius: 4px;
      font-size: 14px;
      transition: border-color 0.2s;
    }

    .search-input:focus {
      outline: none;
      border-color: #2196F3;
      box-shadow: 0 0 0 2px rgba(33, 150, 243, 0.1);
    }

    .filter-group {
      display: flex;
      gap: 8px;
    }

    .checkbox-label {
      display: flex;
      align-items: center;
      gap: 8px;
      cursor: pointer;
      user-select: none;
      padding: 8px 12px;
      border-radius: 4px;
      transition: background 0.2s;
    }

    .checkbox-label:hover {
      background: #f5f5f5;
    }

    .checkbox {
      cursor: pointer;
      width: 16px;
      height: 16px;
    }

    .loading-spinner {
      text-align: center;
      padding: 40px;
      font-size: 16px;
      color: #666;
    }

    .empty-state {
      text-align: center;
      padding: 60px 20px;
      background: #f9f9f9;
      border-radius: 8px;
      color: #666;
    }

    .empty-state p {
      font-size: 16px;
      margin-bottom: 16px;
    }

    .table-container {
      overflow-x: auto;
      background: white;
      border: 1px solid #e0e0e0;
      border-radius: 8px;
      margin-bottom: 16px;
    }

    .table {
      width: 100%;
      border-collapse: collapse;
      font-size: 14px;
    }

    .table thead {
      background: #f5f5f5;
      border-bottom: 2px solid #ddd;
    }

    .table th {
      padding: 12px 16px;
      text-align: left;
      font-weight: 600;
      color: #333;
    }

    .table td {
      padding: 12px 16px;
      border-bottom: 1px solid #f0f0f0;
    }

    .table tbody tr:hover {
      background: #fafafa;
    }

    .sortable-header {
      cursor: pointer;
      user-select: none;
      position: relative;
      padding-right: 24px;
      transition: background 0.2s;
    }

    .sortable-header:hover {
      background: #efefef;
    }

    .sort-indicator {
      position: absolute;
      right: 8px;
      font-size: 12px;
      color: #999;
    }

    .numeric {
      text-align: right;
    }

    .center {
      text-align: center;
    }

    .bold {
      font-weight: 500;
      color: #333;
    }

    .truncate {
      max-width: 200px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      color: #666;
    }

    .small {
      color: #999;
      font-size: 13px;
    }

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

    .btn {
      padding: 8px 16px;
      border: none;
      border-radius: 4px;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }

    .btn:hover {
      transform: translateY(-1px);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }

    .btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
      transform: none;
    }

    .btn-primary {
      background: #2196F3;
      color: white;
    }

    .btn-primary:hover:not(:disabled) {
      background: #1976D2;
    }

    .btn-secondary {
      background: #f5f5f5;
      color: #333;
      border: 1px solid #ddd;
    }

    .btn-secondary:hover:not(:disabled) {
      background: #ececec;
    }

    .btn-warning {
      background: #ff9800;
      color: white;
    }

    .btn-warning:hover:not(:disabled) {
      background: #f57c00;
    }

    .btn-success {
      background: #4caf50;
      color: white;
    }

    .btn-success:hover:not(:disabled) {
      background: #388e3c;
    }

    .btn-sm {
      padding: 6px 10px;
      font-size: 12px;
    }

    .pagination-container {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 16px;
      padding: 16px;
      background: white;
      border: 1px solid #e0e0e0;
      border-radius: 8px;
    }

    .pagination-info {
      color: #666;
      font-size: 14px;
    }

    .error-banner {
      background: #ffebee;
      color: #c62828;
      padding: 12px 16px;
      border-radius: 4px;
      margin-top: 16px;
      border-left: 4px solid #c62828;
    }
  `
})
export class CategoryListComponent implements OnInit {
  private searchSubject = new Subject<string>();

  constructor(
    private categoryService: CategoryService,
    private router: Router
  ) {}

  // Signals
  searchQuery = signal('');
  activeOnly = signal(false);
  sortBy = signal('name');
  sortDir = signal<'asc' | 'desc'>('asc');
  currentPage = signal(1);
  pageSize = signal(10);
  errorMessage = signal('');

  // Services - use getter to defer initialization
  get categories$() {
    return this.categoryService.categories;
  }

  get isLoading() {
    return this.categoryService.isLoading;
  }

  get totalElements() {
    return this.categoryService.totalElements;
  }

  // Computed signals
  totalPages = computed(() =>
    Math.max(1, Math.ceil(this.totalElements() / this.pageSize()))
  );

  filteredCategories = computed(() => {
    const all = this.categories$();
    const search = this.searchQuery().toLowerCase();
    const activeOnlyFilter = this.activeOnly();
    const sortField = this.sortBy();
    const sortDirection = this.sortDir();

    let filtered = all.filter((cat: CategoryResponse) => {
      const matchesSearch = search === '' || cat.name.toLowerCase().includes(search);
      const matchesActive = !activeOnlyFilter || cat.active;
      return matchesSearch && matchesActive;
    });

    // Sort
    filtered.sort((a: CategoryResponse, b: CategoryResponse) => {
      const aVal = sortField === 'name' ? a.name : new Date(a.createdAt).getTime();
      const bVal = sortField === 'name' ? b.name : new Date(b.createdAt).getTime();

      const comparison = typeof aVal === 'string' && typeof bVal === 'string'
        ? aVal.localeCompare(bVal)
        : Number(aVal) - Number(bVal);

      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return filtered;
  });

  paginatedCategories = computed(() => {
    const filtered = this.filteredCategories();
    const start = (this.currentPage() - 1) * this.pageSize();
    const end = start + this.pageSize();
    return filtered.slice(start, end);
  });

  ngOnInit() {
    // Load initial data
    this.categoryService.loadCategories({
      page: 1,
      size: 100,
      active: undefined,
      sortBy: 'name',
      sortDir: 'asc'
    }).subscribe({
      error: (err) => {
        this.errorMessage.set('Failed to load categories');
        console.error('Error loading categories:', err);
      }
    });

    // Debounced search
    this.searchSubject.pipe(debounceTime(300)).subscribe(() => {
      this.currentPage.set(1);
    });
  }

  onSearchChange(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    this.searchQuery.set(value);
    this.searchSubject.next(value);
  }

  toggleActiveFilter() {
    this.activeOnly.update(v => !v);
    this.currentPage.set(1);
  }

  toggleSort(field: 'name' | 'createdAt') {
    if (this.sortBy() === field) {
      this.sortDir.update(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortBy.set(field);
      this.sortDir.set('asc');
    }
  }

  getSortIndicator(field: string): string {
    if (this.sortBy() !== field) return '';
    return this.sortDir() === 'asc' ? '↑' : '↓';
  }

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

  createNew() {
    this.router.navigate(['/categories/new']);
  }

  editCategory(category: CategoryResponse) {
    this.router.navigate(['/categories', category.id, 'edit']);
  }

  toggleActive(category: CategoryResponse) {
    const operation = category.active
      ? this.categoryService.deactivateCategory(category.id)
      : this.categoryService.activateCategory(category.id);

    operation.subscribe({
      next: () => {
        this.errorMessage.set('');
      },
      error: (err) => {
        this.errorMessage.set(`Failed to ${category.active ? 'deactivate' : 'activate'} category`);
        console.error('Error toggling status:', err);
      }
    });
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }
}
