import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { MovementType } from '../../../../core/models/api-enums.model';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';
import { LoadingSpinnerComponent } from '../../../../shared/components/loading-spinner/loading-spinner.component';
import { PaginationComponent } from '../../../../shared/components/pagination/pagination.component';
import { LocationResponse } from '../../../locations/models/location.model';
import { ProductResponse } from '../../../products/models/product.model';
import { HistoryService } from '../../services/history.service';

type HistorySortField = 'performedAt' | 'quantityDelta';

@Component({
  selector: 'app-history-list',
  standalone: true,
  imports: [CommonModule, EmptyStateComponent, LoadingSpinnerComponent, PaginationComponent],
  template: `
    <section class="page">
      <header class="header">
        <h1>Inventory History</h1>
      </header>

      <section class="filters">
        <select class="control" [value]="selectedProductId()" (change)="onProductChange($event)">
          <option value="">All products</option>
          <option *ngFor="let product of productOptions()" [value]="product.id">
            {{ product.sku }} — {{ product.name }}
          </option>
        </select>

        <select class="control" [value]="selectedLocationId()" (change)="onLocationChange($event)">
          <option value="">All locations</option>
          <option *ngFor="let location of locationOptions()" [value]="location.id">
            {{ location.name }} ({{ location.type }})
          </option>
        </select>

        <select class="control" [value]="selectedMovementType()" (change)="onMovementTypeChange($event)">
          <option value="">All movement types</option>
          <option value="RECEIVE">Receive</option>
          <option value="TRANSFER_OUT">Transfer out</option>
          <option value="TRANSFER_IN">Transfer in</option>
          <option value="ADJUSTMENT">Adjustment</option>
        </select>

        <input
          class="control"
          type="date"
          aria-label="From date"
          [value]="dateFrom()"
          (change)="onDateFromChange($event)"
        />

        <input
          class="control"
          type="date"
          aria-label="To date"
          [value]="dateTo()"
          (change)="onDateToChange($event)"
        />

        <button class="btn" type="button" (click)="applyFilters()">Apply</button>
        <button class="btn secondary" type="button" (click)="clearFilters()">Clear</button>
      </section>

      <app-loading-spinner *ngIf="isLoading()" message="Loading movement history..." />

      <app-empty-state
        *ngIf="!isLoading() && history().length === 0"
        title="No movement history"
        description="No inventory movements match the selected filters."
      />

      <section class="table-wrapper" *ngIf="!isLoading() && history().length > 0">
        <table>
          <thead>
            <tr>
              <th class="sortable" (click)="onSort('performedAt')">When {{ sortMarker('performedAt') }}</th>
              <th>Type</th>
              <th>Product</th>
              <th>Location</th>
              <th class="num sortable" (click)="onSort('quantityDelta')">Delta {{ sortMarker('quantityDelta') }}</th>
              <th>Actor</th>
              <th>Reference / Reason</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let movement of history()">
              <td>{{ formatDateTime(movement.performedAt) }}</td>
              <td>
                <span class="type-badge" [ngClass]="movementTypeClass(movement.movementType)">
                  {{ formatMovementType(movement.movementType) }}
                </span>
              </td>
              <td>{{ movement.product.sku }} — {{ movement.product.name }}</td>
              <td>{{ movement.location.name }}</td>
              <td class="num" [class.positive]="movement.quantityDelta > 0" [class.negative]="movement.quantityDelta < 0">
                {{ signedDelta(movement.quantityDelta) }}
              </td>
              <td>{{ movement.performedBy.fullName || movement.performedBy.username }}</td>
              <td>
                {{ movement.referenceId || '—' }}
                <span *ngIf="movement.reason"> · {{ movement.reason }}</span>
              </td>
            </tr>
          </tbody>
        </table>
      </section>

      <app-pagination
        *ngIf="!isLoading() && history().length > 0"
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

    .header h1 {
      margin: 0;
      font-size: 26px;
      color: #0f172a;
    }

    .filters {
      display: grid;
      grid-template-columns: repeat(4, minmax(180px, 1fr));
      gap: 10px;
      align-items: center;
    }

    .control {
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      padding: 9px 10px;
      font-size: 14px;
      background: #fff;
      min-height: 40px;
    }

    .btn {
      border: 1px solid #0f172a;
      background: #0f172a;
      color: #fff;
      border-radius: 8px;
      padding: 9px 12px;
      cursor: pointer;
      min-height: 40px;
    }

    .btn.secondary {
      border-color: #cbd5e1;
      background: #fff;
      color: #0f172a;
    }

    .table-wrapper {
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      overflow-x: auto;
      background: #fff;
    }

    table {
      width: 100%;
      min-width: 1050px;
      border-collapse: collapse;
    }

    th,
    td {
      text-align: left;
      padding: 10px 12px;
      border-bottom: 1px solid #e2e8f0;
      font-size: 14px;
      vertical-align: top;
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

    .positive {
      color: #166534;
      font-weight: 600;
    }

    .negative {
      color: #b91c1c;
      font-weight: 600;
    }

    .type-badge {
      display: inline-flex;
      padding: 4px 10px;
      border-radius: 999px;
      font-size: 12px;
      font-weight: 600;
      min-width: 96px;
      justify-content: center;
    }

    .type-receive {
      background: #dcfce7;
      color: #166534;
    }

    .type-transfer {
      background: #dbeafe;
      color: #1d4ed8;
    }

    .type-adjustment {
      background: #fef3c7;
      color: #92400e;
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

    @media (max-width: 1100px) {
      .filters {
        grid-template-columns: repeat(2, minmax(160px, 1fr));
      }
    }

    @media (max-width: 700px) {
      .filters {
        grid-template-columns: 1fr;
      }
    }
  `,
})
export class HistoryListComponent implements OnInit {
  private readonly historyService = inject(HistoryService);

  readonly selectedProductId = signal<string>('');
  readonly selectedLocationId = signal<string>('');
  readonly selectedMovementType = signal<string>('');
  readonly dateFrom = signal<string>('');
  readonly dateTo = signal<string>('');
  readonly sortBy = signal<HistorySortField>('performedAt');
  readonly sortDir = signal<'asc' | 'desc'>('desc');
  readonly pageSize = signal<number>(20);
  readonly errorMessage = signal<string>('');

  readonly productOptions = signal<ProductResponse[]>([]);
  readonly locationOptions = signal<LocationResponse[]>([]);

  readonly history = this.historyService.history;
  readonly isLoading = this.historyService.isLoading;
  readonly totalElements = this.historyService.totalElements;
  readonly totalPages = this.historyService.totalPages;
  readonly currentPage = this.historyService.currentPage;

  ngOnInit(): void {
    this.loadOptions();
    this.loadHistory(1);
  }

  onProductChange(event: Event): void {
    this.selectedProductId.set((event.target as HTMLSelectElement).value);
  }

  onLocationChange(event: Event): void {
    this.selectedLocationId.set((event.target as HTMLSelectElement).value);
  }

  onMovementTypeChange(event: Event): void {
    this.selectedMovementType.set((event.target as HTMLSelectElement).value);
  }

  onDateFromChange(event: Event): void {
    this.dateFrom.set((event.target as HTMLInputElement).value);
  }

  onDateToChange(event: Event): void {
    this.dateTo.set((event.target as HTMLInputElement).value);
  }

  applyFilters(): void {
    this.loadHistory(1);
  }

  clearFilters(): void {
    this.selectedProductId.set('');
    this.selectedLocationId.set('');
    this.selectedMovementType.set('');
    this.dateFrom.set('');
    this.dateTo.set('');
    this.sortBy.set('performedAt');
    this.sortDir.set('desc');
    this.loadHistory(1);
  }

  onSort(field: HistorySortField): void {
    if (this.sortBy() === field) {
      this.sortDir.set(this.sortDir() === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortBy.set(field);
      this.sortDir.set(field === 'performedAt' ? 'desc' : 'asc');
    }

    this.loadHistory(1);
  }

  sortMarker(field: HistorySortField): string {
    if (this.sortBy() !== field) {
      return '';
    }
    return this.sortDir() === 'asc' ? '↑' : '↓';
  }

  goPrevious(): void {
    if (this.currentPage() <= 1) {
      return;
    }
    this.loadHistory(this.currentPage() - 1);
  }

  goNext(): void {
    if (this.currentPage() >= this.totalPages()) {
      return;
    }
    this.loadHistory(this.currentPage() + 1);
  }

  signedDelta(quantityDelta: number): string {
    return quantityDelta > 0 ? `+${quantityDelta}` : String(quantityDelta);
  }

  formatMovementType(value: MovementType): string {
    if (value === 'TRANSFER_IN') return 'Transfer In';
    if (value === 'TRANSFER_OUT') return 'Transfer Out';
    if (value === 'RECEIVE') return 'Receive';
    if (value === 'ADJUSTMENT') return 'Adjustment';
    return value;
  }

  movementTypeClass(value: MovementType): string {
    if (value === 'RECEIVE') return 'type-receive';
    if (value === 'TRANSFER_IN' || value === 'TRANSFER_OUT') return 'type-transfer';
    return 'type-adjustment';
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

  private loadOptions(): void {
    this.historyService.getProductOptions().subscribe({
      next: (res) => this.productOptions.set(res.data),
    });

    this.historyService.getLocationOptions().subscribe({
      next: (res) => this.locationOptions.set(res.data),
    });
  }

  private loadHistory(page: number): void {
    this.errorMessage.set('');

    this.historyService
      .loadAll({
        productId: this.toNumber(this.selectedProductId()),
        locationId: this.toNumber(this.selectedLocationId()),
        movementType: (this.selectedMovementType() || undefined) as MovementType | undefined,
        dateFrom: this.toDateFromIso(this.dateFrom()),
        dateTo: this.toDateToIso(this.dateTo()),
        sortBy: this.sortBy(),
        sortDir: this.sortDir(),
        page,
        size: this.pageSize(),
      })
      .subscribe({
        error: () => this.errorMessage.set('Failed to load movement history.'),
      });
  }

  private toNumber(value: string): number | undefined {
    if (!value) {
      return undefined;
    }

    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }

  private toDateFromIso(value: string): string | undefined {
    return value ? `${value}T00:00:00` : undefined;
  }

  private toDateToIso(value: string): string | undefined {
    return value ? `${value}T23:59:59` : undefined;
  }
}
