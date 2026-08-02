import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';
import { LoadingSpinnerComponent } from '../../../../shared/components/loading-spinner/loading-spinner.component';
import { StatusBadgeComponent } from '../../../../shared/components/status-badge/status-badge.component';
import { ProductInventoryTableComponent } from '../../components/product-inventory-table/product-inventory-table.component';
import { ProductService } from '../../services/product.service';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [
    CommonModule,
    LoadingSpinnerComponent,
    EmptyStateComponent,
    StatusBadgeComponent,
    ProductInventoryTableComponent,
  ],
  templateUrl: './product-detail.component.html',
  styleUrls: ['./product-detail.component.scss'],
})
export class ProductDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly productService = inject(ProductService);

  readonly product = computed(() => this.productService.selectedProduct());
  readonly isLoading = this.productService.isLoading;
  readonly errorMessage = signal('');

  private productId: number | null = null;

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (!idParam) {
      this.errorMessage.set('Invalid product id.');
      return;
    }

    this.productId = Number(idParam);

    this.productService.loadProduct(this.productId).subscribe({
      error: () => this.errorMessage.set('Failed to load product details.'),
    });
  }

  goBack(): void {
    this.router.navigate(['/products']);
  }

  goToEdit(): void {
    if (!this.productId) {
      return;
    }
    this.router.navigate(['/products', this.productId, 'edit']);
  }

  deactivate(): void {
    if (!this.productId || !this.product()) {
      return;
    }

    const confirmed = window.confirm('Delete this product? This action deactivates the product.');
    if (!confirmed) {
      return;
    }

    this.productService.deactivateProduct(this.productId).subscribe({
      next: () => this.router.navigate(['/products']),
      error: () => this.errorMessage.set('Failed to deactivate product.'),
    });
  }

  formatDate(value: string): string {
    return new Date(value).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }
}
