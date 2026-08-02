import { Component, input } from '@angular/core';
import { ProductInventorySummaryResponse } from '../../models/product.model';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';
import { StatusBadgeComponent } from '../../../../shared/components/status-badge/status-badge.component';

@Component({
  selector: 'app-product-inventory-table',
  standalone: true,
  imports: [EmptyStateComponent, StatusBadgeComponent],
  templateUrl: './product-inventory-table.component.html',
  styleUrls: ['./product-inventory-table.component.scss']
})
export class ProductInventoryTableComponent {
  readonly inventory = input<ProductInventorySummaryResponse[]>([]);

  formatStatus(status: string): string {
    if (status === 'IN_STOCK') return 'In stock';
    if (status === 'LOW_STOCK') return 'Low stock';
    if (status === 'OUT_OF_STOCK') return 'Out of stock';
    return status;
  }
}
