import { CommonModule } from '@angular/common';
import { Component, input } from '@angular/core';
import { ProductInventorySummaryResponse } from '../../models/product.model';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';
import { StatusBadgeComponent } from '../../../../shared/components/status-badge/status-badge.component';

@Component({
  selector: 'app-product-inventory-table',
  standalone: true,
  imports: [CommonModule, EmptyStateComponent, StatusBadgeComponent],
  template: `
    <section>
      <h3>Inventory by Location</h3>

      <app-empty-state
        *ngIf="inventory().length === 0"
        title="No inventory records"
        description="This product has no stock records yet."
      />

      <div class="table-wrapper" *ngIf="inventory().length > 0">
        <table>
          <thead>
            <tr>
              <th>Location</th>
              <th>Type</th>
              <th class="qty">Quantity</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let item of inventory()">
              <td>{{ item.locationName }}</td>
              <td>{{ item.locationType }}</td>
              <td class="qty">{{ item.quantityOnHand }}</td>
              <td>
                <app-status-badge [value]="item.stockStatus" [label]="formatStatus(item.stockStatus)" />
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  `,
  styles: `
    h3 {
      margin: 0 0 14px;
      color: #1e293b;
      font-size: 18px;
    }

    .table-wrapper {
      overflow-x: auto;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      background: #fff;
    }

    table {
      border-collapse: collapse;
      width: 100%;
      min-width: 520px;
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
    }

    .qty {
      text-align: right;
      font-variant-numeric: tabular-nums;
    }
  `
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
