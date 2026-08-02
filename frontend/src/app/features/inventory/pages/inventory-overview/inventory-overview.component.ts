import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { debounceTime, Subject } from 'rxjs';
import { StockStatus } from '../../../../core/models/api-enums.model';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';
import { LoadingSpinnerComponent } from '../../../../shared/components/loading-spinner/loading-spinner.component';
import { PaginationComponent } from '../../../../shared/components/pagination/pagination.component';
import { StatusBadgeComponent } from '../../../../shared/components/status-badge/status-badge.component';
import { InventoryService } from '../../services/inventory.service';

type InventorySortField =
  | 'productName'
  | 'sku'
  | 'locationName'
  | 'quantityOnHand'
  | 'stockStatus';

@Component({
  selector: 'app-inventory-overview',
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
      <header class="header">
        <h1>Inventory</h1>
        <div>
          <button class="btn" type="button" (click)="goToReceive()">+ Receive</button>
          <button class="btn" type="button" (click)="goToTransfer()">Transfer</button>
          <button class="btn" type="button" (click)="goToAdjust()">Adjust</button>
        </div>
      </header>

      <section class="filters">
        <input
          class="control"
          type="text"
          placeholder="Search product name or SKU"
          [value]="search()"
          (input)="onSearchInput($event)"
        />

        <select class="control" [value]="stockStatus()" (change)="onStockStatusChange($event)">
          <option value="">All stock statuses</option>
          <option value="IN_STOCK">In stock</option>
          <option value="LOW_STOCK">Low stock</option>
          <option value="OUT_OF_STOCK">Out of stock</option>
        </select>
      </section>

      <app-loading-spinner *ngIf="isLoading()" message="Loading inventory..." />

      <app-empty-state
        *ngIf="!isLoading() && inventory().length === 0"
        title="No inventory rows"
        description="No product-location inventory matches the selected filters."
      />

      <section class="table-wrapper" *ngIf="!isLoading() && inventory().length > 0">
        <table>
          <thead>
            <tr>
              <th class="sortable" (click)="onSort('sku')">SKU {{ sortMarker('sku') }}</th>
              <th class="sortable" (click)="onSort('productName')">Product {{ sortMarker('productName') }}</th>
              <th class="sortable" (click)="onSort('locationName')">Location {{ sortMarker('locationName') }}</th>
              <th>Type</th>
              <th class="num sortable" (click)="onSort('quantityOnHand')">Current quantity {{ sortMarker('quantityOnHand') }}</th>
              <th class="sortable" (click)="onSort('stockStatus')">Stock status {{ sortMarker('stockStatus') }}</th>
              <th>Updated</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let row of inventory()">
              <td>{{ row.product.sku }}</td>
              <td>{{ row.product.name }}</td>
              <td>{{ row.location.name }}</td>
              <td>{{ row.location.type }}</td>
              <td class="num">{{ row.quantityOnHand }}</td>
              <td>
                <app-status-badge [value]="row.stockStatus" [label]="formatStockStatus(row.stockStatus)" />
              </td>
              <td>{{ formatDate(row.updatedAt) }}</td>
            </tr>
          </tbody>
        </table>
      </section>

      <app-pagination
        *ngIf="!isLoading() && inventory().length > 0"
        [page]="currentPage()"
        [totalPages]="totalPages()"
        [totalElements]="totalElements()"
        (previous)="goPrevious()"
        (next)="goNext()"
      />

      <section class="history">
        <h2>Recent Inventory History</h2>
        <app-loading-spinner *ngIf="isLoadingMovements()" [compact]="true" message="Loading history..." />

        <app-empty-state
          *ngIf="!isLoadingMovements() && movements().length === 0"
          title="No movement history"
          description="Receive, transfer, and adjustment operations will appear here."
        />

        <div class="table-wrapper" *ngIf="!isLoadingMovements() && movements().length > 0">
          <table>
            <thead>
              <tr>
                <th>When</th>
                <th>Type</th>
                <th>Product</th>
                <th>Location</th>
                <th class="num">Delta</th>
                <th>Reason</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let movement of movements()">
                <td>{{ formatDateTime(movement.performedAt) }}</td>
                <td>{{ formatMovementType(movement.movementType) }}</td>
                <td>{{ movement.product.sku }} — {{ movement.product.name }}</td>
                <td>{{ movement.location.name }}</td>
                <td class="num" [class.positive]="movement.quantityDelta > 0" [class.negative]="movement.quantityDelta < 0">
                  {{ movement.quantityDelta > 0 ? '+' : '' }}{{ movement.quantityDelta }}
                </td>
                <td>{{ movement.reason || '—' }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

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

    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 12px;
      flex-wrap: wrap;
    }

    .header h1 {
      margin: 0;
      color: #0f172a;
      font-size: 26px;
    }

    .filters {
      display: grid;
      grid-template-columns: 1.4fr 1fr;
      gap: 10px;
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
      min-width: 980px;
      border-collapse: collapse;
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

    .history {
      margin-top: 8px;
      display: grid;
      gap: 10px;
    }

    .history h2 {
      margin: 0;
      color: #1e293b;
      font-size: 20px;
    }

    .positive {
      color: #166534;
      font-weight: 600;
    }

    .negative {
      color: #b91c1c;
      font-weight: 600;
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
export class InventoryOverviewComponent implements OnInit {
  private readonly inventoryService = inject(InventoryService);
  private readonly router = inject(Router);
  private readonly searchSubject = new Subject<string>();

  readonly search = signal('');
  readonly stockStatus = signal('');
  readonly sortBy = signal<InventorySortField>('productName');
  readonly sortDir = signal<'asc' | 'desc'>('asc');
  readonly currentPage = signal(1);
  readonly pageSize = signal(20);
  readonly errorMessage = signal('');

  readonly inventory = this.inventoryService.inventoryList;
  readonly isLoading = this.inventoryService.isLoading;
  readonly totalElements = this.inventoryService.totalElements;
  readonly totalPages = this.inventoryService.totalPages;
  readonly movements = this.inventoryService.movements;
  readonly isLoadingMovements = this.inventoryService.isLoadingMovements;

  ngOnInit(): void {
    this.loadInventory();
    this.loadRecentHistory();

    this.searchSubject.pipe(debounceTime(300)).subscribe(() => {
      this.currentPage.set(1);
      this.loadInventory();
    });
  }

  onSearchInput(event: Event): void {
    this.search.set((event.target as HTMLInputElement).value);
    this.searchSubject.next(this.search());
  }

  onStockStatusChange(event: Event): void {
    this.stockStatus.set((event.target as HTMLSelectElement).value);
    this.currentPage.set(1);
    this.loadInventory();
  }

  onSort(field: InventorySortField): void {
    if (this.sortBy() === field) {
      this.sortDir.set(this.sortDir() === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortBy.set(field);
      this.sortDir.set('asc');
    }
    this.loadInventory();
  }

  sortMarker(field: InventorySortField): string {
    if (this.sortBy() !== field) {
      return '';
    }
    return this.sortDir() === 'asc' ? '↑' : '↓';
  }

  goPrevious(): void {
    if (this.currentPage() <= 1) {
      return;
    }
    this.currentPage.update((p) => p - 1);
    this.loadInventory();
  }

  goNext(): void {
    if (this.currentPage() >= this.totalPages()) {
      return;
    }
    this.currentPage.update((p) => p + 1);
    this.loadInventory();
  }

  goToReceive(): void {
    this.router.navigate(['/inventory/receive']);
  }

  goToTransfer(): void {
    this.router.navigate(['/inventory/transfer']);
  }

  goToAdjust(): void {
    this.router.navigate(['/inventory/adjust']);
  }

  formatStockStatus(status: StockStatus): string {
    if (status === 'IN_STOCK') return 'In stock';
    if (status === 'LOW_STOCK') return 'Low stock';
    if (status === 'OUT_OF_STOCK') return 'Out of stock';
    return status;
  }

  formatMovementType(value: string): string {
    if (value === 'TRANSFER_IN') return 'Transfer in';
    if (value === 'TRANSFER_OUT') return 'Transfer out';
    if (value === 'RECEIVE') return 'Receive';
    if (value === 'ADJUSTMENT') return 'Adjustment';
    return value;
  }

  formatDate(value: string): string {
    return new Date(value).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }

  formatDateTime(value: string): string {
    return new Date(value).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  private loadInventory(): void {
    this.errorMessage.set('');

    this.inventoryService
      .loadInventory({
        search: this.search().trim() || undefined,
        stockStatus: (this.stockStatus() as StockStatus) || undefined,
        sortBy: this.sortBy(),
        sortDir: this.sortDir(),
        page: this.currentPage(),
        size: this.pageSize(),
      })
      .subscribe({
        error: () => this.errorMessage.set('Failed to load inventory.'),
      });
  }

  private loadRecentHistory(): void {
    this.inventoryService
      .loadMovements({
        sortBy: 'performedAt',
        sortDir: 'desc',
        page: 1,
        size: 10,
      })
      .subscribe({
        error: () => this.errorMessage.set('Failed to load movement history.'),
      });
  }
}
