import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
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
  imports: [DecimalPipe, EmptyStateComponent, LoadingSpinnerComponent, PaginationComponent, StatusBadgeComponent],
  templateUrl: './product-list.component.html',
  styleUrls: ['./product-list.component.scss'],
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
