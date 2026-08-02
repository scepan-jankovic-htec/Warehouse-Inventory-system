import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { debounceTime, Subject } from 'rxjs';
import { CategoryService } from '../../../categories/services/category.service';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';
import { LoadingSpinnerComponent } from '../../../../shared/components/loading-spinner/loading-spinner.component';
import { PaginationComponent } from '../../../../shared/components/pagination/pagination.component';
import { StatusBadgeComponent } from '../../../../shared/components/status-badge/status-badge.component';
import { ProductResponse } from '../../models/product.model';
import { ProductService } from '../../services/product.service';

type ActiveFilter = 'ALL' | 'ACTIVE' | 'INACTIVE';
type ProductSortField = 'name' | 'sku' | 'categoryName' | 'createdAt';

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [
    CommonModule,
    EmptyStateComponent,
    LoadingSpinnerComponent,
    PaginationComponent,
    StatusBadgeComponent,
  ],
  template: `
    <section class="page">
      <header class="page-header">
        <h1>Products</h1>
        <button type="button" class="btn btn-primary" (click)="goToCreate()">+ New Product</button>
      </header>

      <section class="filters">
        <input
          type="text"
          class="control"
          placeholder="Search by SKU or name"
          [value]="search()"
          (input)="onSearchInput($event)"
        />

        <select class="control" [value]="selectedCategoryId()" (change)="onCategoryChange($event)">
          <option value="">All categories</option>
          <option *ngFor="let category of categories()" [value]="category.id">{{ category.name }}</option>
        </select>

        <select class="control" [value]="activeFilter()" (change)="onActiveFilterChange($event)">
          <option value="ALL">All statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
        </select>
      </section>

      <app-loading-spinner *ngIf="isLoading()" message="Loading products..." />

      <app-empty-state
        *ngIf="!isLoading() && products().length === 0"
        title="No products found"
        description="Try changing filters or create a new product."
      />

      <section class="table-wrapper" *ngIf="!isLoading() && products().length > 0">
        <table>
          <thead>
            <tr>
              <th (click)="onSort('sku')" class="sortable">SKU {{ sortMarker('sku') }}</th>
              <th (click)="onSort('name')" class="sortable">Name {{ sortMarker('name') }}</th>
              <th (click)="onSort('categoryName')" class="sortable">Category {{ sortMarker('categoryName') }}</th>
              <th>UOM</th>
              <th class="num">Reorder</th>
              <th>Status</th>
              <th (click)="onSort('createdAt')" class="sortable">Created {{ sortMarker('createdAt') }}</th>
              <th class="actions-col">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let product of products()">
              <td>{{ product.sku }}</td>
              <td>{{ product.name }}</td>
              <td>{{ product.category.name }}</td>
              <td>{{ product.unitOfMeasure }}</td>
              <td class="num">{{ product.reorderThreshold }}</td>
              <td>
                <app-status-badge
                  [value]="product.active ? 'ACTIVE' : 'INACTIVE'"
                  [label]="product.active ? 'Active' : 'Inactive'"
                />
              </td>
              <td>{{ formatDate(product.createdAt) }}</td>
              <td class="actions-col">
                <button type="button" class="btn btn-sm" (click)="goToDetail(product.id)">View</button>
                <button type="button" class="btn btn-sm" (click)="goToEdit(product.id)">Edit</button>
                <button
                  *ngIf="product.active"
                  type="button"
                  class="btn btn-sm btn-danger"
                  (click)="deactivate(product)"
                >
                  Delete
                </button>
                <button
                  *ngIf="!product.active"
                  type="button"
                  class="btn btn-sm btn-success"
                  (click)="activate(product.id)"
                >
                  Activate
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </section>

      <app-pagination
        *ngIf="!isLoading() && products().length > 0"
        [page]="currentPage()"
        [totalPages]="totalPages()"
        [totalElements]="totalElements()"
        (previous)="goPrevious()"
        (next)="goNext()"
      />

      <p class="error" *ngIf="errorMessage()">{{ errorMessage() }}</p>
    </section>
  `,
  styles: `
    .page {
      max-width: 1200px;
      margin: 0 auto;
      padding: 24px;
      display: grid;
      gap: 16px;
    }

    .page-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
    }

    h1 {
      margin: 0;
      font-size: 26px;
      color: #0f172a;
    }

    .filters {
      display: grid;
      gap: 10px;
      grid-template-columns: 1.4fr 1fr 1fr;
    }

    .control {
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      padding: 9px 10px;
      font-size: 14px;
      background: #fff;
    }

    .table-wrapper {
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      overflow-x: auto;
      background: #fff;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      min-width: 980px;
    }

    th,
    td {
      text-align: left;
      padding: 10px 12px;
      border-bottom: 1px solid #e2e8f0;
      font-size: 14px;
    }

    th {
      background: #f8fafc;
      color: #334155;
      font-weight: 600;
      white-space: nowrap;
    }

    .sortable {
      cursor: pointer;
      user-select: none;
    }

    .num {
      text-align: right;
      font-variant-numeric: tabular-nums;
    }

    .actions-col {
      white-space: nowrap;
    }

    .btn {
      border: 1px solid #cbd5e1;
      background: #fff;
      color: #0f172a;
      border-radius: 6px;
      padding: 8px 12px;
      cursor: pointer;
      margin-right: 6px;
    }

    .btn-sm {
      padding: 6px 10px;
      font-size: 12px;
    }

    .btn-primary {
      border-color: #2563eb;
      background: #2563eb;
      color: #fff;
    }

    .btn-danger {
      border-color: #dc2626;
      background: #dc2626;
      color: #fff;
    }

    .btn-success {
      border-color: #16a34a;
      background: #16a34a;
      color: #fff;
    }

    .error {
      margin: 0;
      color: #b91c1c;
      background: #fee2e2;
      border: 1px solid #fecaca;
      border-radius: 6px;
      padding: 10px 12px;
      font-size: 14px;
    }

    @media (max-width: 900px) {
      .filters {
        grid-template-columns: 1fr;
      }
    }
  `,
})
export class ProductListComponent implements OnInit {
  private readonly productService = inject(ProductService);
  private readonly categoryService = inject(CategoryService);
  private readonly router = inject(Router);
  private readonly searchSubject = new Subject<string>();

  readonly search = signal('');
  readonly selectedCategoryId = signal('');
  readonly activeFilter = signal<ActiveFilter>('ALL');
  readonly sortBy = signal<ProductSortField>('name');
  readonly sortDir = signal<'asc' | 'desc'>('asc');
  readonly currentPage = signal(1);
  readonly pageSize = signal(20);
  readonly errorMessage = signal('');

  readonly products = this.productService.products;
  readonly categories = computed(() => this.categoryService.categories());
  readonly isLoading = this.productService.isLoading;
  readonly totalElements = this.productService.totalElements;
  readonly totalPages = this.productService.totalPages;

  ngOnInit(): void {
    this.categoryService
      .loadCategories({ active: true, sortBy: 'name', sortDir: 'asc', page: 1, size: 200 })
      .subscribe({ error: () => undefined });

    this.loadProducts();

    this.searchSubject.pipe(debounceTime(300)).subscribe(() => {
      this.currentPage.set(1);
      this.loadProducts();
    });
  }

  onSearchInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.search.set(value);
    this.searchSubject.next(value);
  }

  onCategoryChange(event: Event): void {
    this.selectedCategoryId.set((event.target as HTMLSelectElement).value);
    this.currentPage.set(1);
    this.loadProducts();
  }

  onActiveFilterChange(event: Event): void {
    this.activeFilter.set((event.target as HTMLSelectElement).value as ActiveFilter);
    this.currentPage.set(1);
    this.loadProducts();
  }

  onSort(field: ProductSortField): void {
    if (this.sortBy() === field) {
      this.sortDir.set(this.sortDir() === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortBy.set(field);
      this.sortDir.set('asc');
    }
    this.loadProducts();
  }

  sortMarker(field: ProductSortField): string {
    if (this.sortBy() !== field) {
      return '';
    }
    return this.sortDir() === 'asc' ? '↑' : '↓';
  }

  goPrevious(): void {
    if (this.currentPage() <= 1) {
      return;
    }
    this.currentPage.update((page) => page - 1);
    this.loadProducts();
  }

  goNext(): void {
    if (this.currentPage() >= this.totalPages()) {
      return;
    }
    this.currentPage.update((page) => page + 1);
    this.loadProducts();
  }

  goToCreate(): void {
    this.router.navigate(['/products/new']);
  }

  goToDetail(id: number): void {
    this.router.navigate(['/products', id]);
  }

  goToEdit(id: number): void {
    this.router.navigate(['/products', id, 'edit']);
  }

  deactivate(product: ProductResponse): void {
    const confirmed = window.confirm(`Delete product ${product.sku}? This will deactivate it.`);
    if (!confirmed) {
      return;
    }

    this.productService.deactivateProduct(product.id).subscribe({
      next: () => this.errorMessage.set(''),
      error: () => this.errorMessage.set('Failed to deactivate product.'),
    });
  }

  activate(id: number): void {
    this.productService.activateProduct(id).subscribe({
      next: () => this.errorMessage.set(''),
      error: () => this.errorMessage.set('Failed to activate product.'),
    });
  }

  formatDate(value: string): string {
    return new Date(value).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }

  private loadProducts(): void {
    this.errorMessage.set('');

    this.productService
      .loadProducts({
        search: this.search().trim() || undefined,
        categoryId: this.selectedCategoryId() ? Number(this.selectedCategoryId()) : undefined,
        active:
          this.activeFilter() === 'ALL'
            ? undefined
            : this.activeFilter() === 'ACTIVE',
        sortBy: this.sortBy(),
        sortDir: this.sortDir(),
        page: this.currentPage(),
        size: this.pageSize(),
      })
      .subscribe({
        error: () => this.errorMessage.set('Failed to load products.'),
      });
  }
}
