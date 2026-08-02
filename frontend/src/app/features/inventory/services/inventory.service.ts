import { Injectable, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { ApiResponse, PagedResponse } from '../../../core/models/api-response.model';
import { InventoryResponse } from '../models/inventory.model';
import {
  MovementResponse,
  MovementOperationResponse,
  TransferResponseEnvelope,
  ReceiveRequest,
  TransferRequest,
  AdjustmentRequest,
} from '../models/movement.model';
import { StockStatus, MovementType } from '../../../core/models/api-enums.model';

export interface InventoryListParams {
  locationId?: number;
  productId?: number;
  categoryId?: number;
  stockStatus?: StockStatus;
  search?: string;
  sortBy?: string;
  sortDir?: 'asc' | 'desc';
  page?: number;
  size?: number;
}

export interface MovementListParams {
  productId?: number;
  locationId?: number;
  movementType?: MovementType;
  performedBy?: number;
  dateFrom?: string;
  dateTo?: string;
  sortBy?: string;
  sortDir?: 'asc' | 'desc';
  page?: number;
  size?: number;
}

@Injectable({
  providedIn: 'root',
})
export class InventoryService {
  private readonly baseUrl = `${environment.apiUrl}/inventory`;

  // ── Writable state ────────────────────────────────────────────────────────
  private readonly _inventoryList = signal<InventoryResponse[]>([]);
  private readonly _isLoading = signal<boolean>(false);
  private readonly _totalElements = signal<number>(0);
  private readonly _totalPages = signal<number>(0);
  private readonly _currentPage = signal<number>(1);

  // ── Public read-only signals ───────────────────────────────────────────────
  readonly inventoryList = this._inventoryList.asReadonly();
  readonly isLoading = this._isLoading.asReadonly();
  readonly totalElements = this._totalElements.asReadonly();
  readonly totalPages = this._totalPages.asReadonly();
  readonly currentPage = this._currentPage.asReadonly();

  constructor(private readonly http: HttpClient) {}

  /**
   * Load a paginated inventory view. Supports filtering by location,
   * product, category, stock status, and free-text search.
   * Updates `inventoryList`, pagination, and `isLoading` signals.
   */
  loadInventory(params: InventoryListParams = {}): void {
    this._isLoading.set(true);
    this.getInventory(params).subscribe({
      next: (res) => {
        this._inventoryList.set(res.data);
        this._totalElements.set(res.pagination.totalElements);
        this._totalPages.set(res.pagination.totalPages);
        this._currentPage.set(res.pagination.page);
        this._isLoading.set(false);
      },
      error: () => this._isLoading.set(false),
    });
  }

  // ── Inventory query HTTP methods ──────────────────────────────────────────

  getInventory(params: InventoryListParams = {}): Observable<PagedResponse<InventoryResponse>> {
    let httpParams = new HttpParams();
    if (params.locationId !== undefined) httpParams = httpParams.set('locationId', String(params.locationId));
    if (params.productId !== undefined) httpParams = httpParams.set('productId', String(params.productId));
    if (params.categoryId !== undefined) httpParams = httpParams.set('categoryId', String(params.categoryId));
    if (params.stockStatus) httpParams = httpParams.set('stockStatus', params.stockStatus);
    if (params.search) httpParams = httpParams.set('search', params.search);
    if (params.sortBy) httpParams = httpParams.set('sortBy', params.sortBy);
    if (params.sortDir) httpParams = httpParams.set('sortDir', params.sortDir);
    if (params.page !== undefined) httpParams = httpParams.set('page', String(params.page));
    if (params.size !== undefined) httpParams = httpParams.set('size', String(params.size));
    return this.http.get<PagedResponse<InventoryResponse>>(this.baseUrl, { params: httpParams });
  }

  /**
   * Returns inventory for a single product-location combination.
   * Returns 404 when the combination has no record.
   */
  getInventoryByProductAndLocation(
    productId: number,
    locationId: number
  ): Observable<ApiResponse<InventoryResponse>> {
    return this.http.get<ApiResponse<InventoryResponse>>(`${this.baseUrl}/${productId}/${locationId}`);
  }

  // ── Movement HTTP methods ─────────────────────────────────────────────────

  /**
   * Receive stock at a location. Increases on-hand quantity.
   * Returns the created RECEIVE movement record.
   */
  receive(body: ReceiveRequest): Observable<ApiResponse<MovementOperationResponse>> {
    return this.http.post<ApiResponse<MovementOperationResponse>>(
      `${this.baseUrl}/movements/receive`,
      body
    );
  }

  /**
   * Transfer stock between two locations.
   * Returns linked TRANSFER_OUT and TRANSFER_IN movement records.
   * Business rule: source and destination must differ; quantity must not exceed available stock.
   */
  transfer(body: TransferRequest): Observable<ApiResponse<TransferResponseEnvelope>> {
    return this.http.post<ApiResponse<TransferResponseEnvelope>>(
      `${this.baseUrl}/movements/transfer`,
      body
    );
  }

  /**
   * Record a manual stock adjustment (positive or negative).
   * Business rule: reason is always required; result must not go below zero.
   * Returns the created ADJUSTMENT movement record.
   */
  adjust(body: AdjustmentRequest): Observable<ApiResponse<MovementOperationResponse>> {
    return this.http.post<ApiResponse<MovementOperationResponse>>(
      `${this.baseUrl}/movements/adjust`,
      body
    );
  }

  /**
   * Fetch paginated movement history with optional filters.
   */
  getMovements(params: MovementListParams = {}): Observable<PagedResponse<MovementResponse>> {
    let httpParams = new HttpParams();
    if (params.productId !== undefined) httpParams = httpParams.set('productId', String(params.productId));
    if (params.locationId !== undefined) httpParams = httpParams.set('locationId', String(params.locationId));
    if (params.movementType) httpParams = httpParams.set('movementType', params.movementType);
    if (params.performedBy !== undefined) httpParams = httpParams.set('performedBy', String(params.performedBy));
    if (params.dateFrom) httpParams = httpParams.set('dateFrom', params.dateFrom);
    if (params.dateTo) httpParams = httpParams.set('dateTo', params.dateTo);
    if (params.sortBy) httpParams = httpParams.set('sortBy', params.sortBy);
    if (params.sortDir) httpParams = httpParams.set('sortDir', params.sortDir);
    if (params.page !== undefined) httpParams = httpParams.set('page', String(params.page));
    if (params.size !== undefined) httpParams = httpParams.set('size', String(params.size));
    return this.http.get<PagedResponse<MovementResponse>>(`${this.baseUrl}/movements`, { params: httpParams });
  }

  getMovement(id: number): Observable<ApiResponse<MovementResponse>> {
    return this.http.get<ApiResponse<MovementResponse>>(`${this.baseUrl}/movements/${id}`);
  }
}

  readonly inventory = this.inventoryState.asReadonly();
  readonly movements = this.movementsState.asReadonly();
}
