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
  templateUrl: './category-list.component.html',
  styleUrls: ['./category-list.component.scss'],
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
