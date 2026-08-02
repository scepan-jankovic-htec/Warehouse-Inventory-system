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
  templateUrl: './history-list.component.html',
  styleUrls: ['./history-list.component.scss'],
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
