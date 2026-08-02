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
  templateUrl: './inventory-overview.component.html',
  styleUrls: ['./inventory-overview.component.scss'],
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
