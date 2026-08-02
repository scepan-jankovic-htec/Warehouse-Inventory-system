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
  template: `
    <section class="page">
      <header class="header">
        <button type="button" class="btn" (click)="goBack()">← Back to list</button>
        <div>
          <button type="button" class="btn" [disabled]="!product()" (click)="goToEdit()">Edit</button>
          <button
            type="button"
            class="btn btn-danger"
            [disabled]="!product() || !product()?.active"
            (click)="deactivate()"
          >
            Delete
          </button>
        </div>
      </header>

      <app-loading-spinner *ngIf="isLoading()" message="Loading product details..." />

      <app-empty-state
        *ngIf="!isLoading() && !product()"
        title="Product not found"
        description="The requested product does not exist or is not accessible."
      />

      <article *ngIf="!isLoading() && product() as detail" class="card">
        <header class="card-header">
          <h1>{{ detail.name }}</h1>
          <app-status-badge
            [value]="detail.active ? 'ACTIVE' : 'INACTIVE'"
            [label]="detail.active ? 'Active' : 'Inactive'"
          />
        </header>

        <dl class="meta-grid">
          <div>
            <dt>SKU</dt>
            <dd>{{ detail.sku }}</dd>
          </div>
          <div>
            <dt>Category</dt>
            <dd>{{ detail.category.name }}</dd>
          </div>
          <div>
            <dt>Unit of measure</dt>
            <dd>{{ detail.unitOfMeasure }}</dd>
          </div>
          <div>
            <dt>Reorder threshold</dt>
            <dd>{{ detail.reorderThreshold }}</dd>
          </div>
          <div>
            <dt>Created</dt>
            <dd>{{ formatDate(detail.createdAt) }}</dd>
          </div>
          <div>
            <dt>Updated</dt>
            <dd>{{ formatDate(detail.updatedAt) }}</dd>
          </div>
        </dl>

        <section class="description">
          <h3>Description</h3>
          <p>{{ detail.description || 'No description provided.' }}</p>
        </section>

        <app-product-inventory-table [inventory]="detail.inventory" />
      </article>

      <p class="error" *ngIf="errorMessage()">{{ errorMessage() }}</p>
    </section>
  `,
  styles: `
    .page {
      max-width: 1000px;
      margin: 0 auto;
      padding: 24px;
      display: grid;
      gap: 16px;
    }

    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 12px;
      flex-wrap: wrap;
    }

    .card {
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      background: #fff;
      padding: 18px;
      display: grid;
      gap: 18px;
    }

    .card-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      border-bottom: 1px solid #e2e8f0;
      padding-bottom: 12px;
    }

    h1 {
      margin: 0;
      color: #0f172a;
      font-size: 24px;
    }

    .meta-grid {
      margin: 0;
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 12px;
    }

    dt {
      color: #64748b;
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      margin-bottom: 4px;
    }

    dd {
      margin: 0;
      color: #1e293b;
      font-size: 14px;
    }

    .description h3 {
      margin: 0 0 8px;
      color: #1e293b;
      font-size: 16px;
    }

    .description p {
      margin: 0;
      color: #334155;
      font-size: 14px;
      white-space: pre-wrap;
    }

    .btn {
      border: 1px solid #cbd5e1;
      background: #fff;
      color: #0f172a;
      border-radius: 6px;
      padding: 8px 12px;
      cursor: pointer;
      margin-left: 6px;
    }

    .btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .btn-danger {
      border-color: #dc2626;
      background: #dc2626;
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
  `,
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
