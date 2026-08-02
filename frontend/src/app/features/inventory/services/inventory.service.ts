import { Injectable, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { finalize, Observable, tap } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { ApiResponse, PagedResponse } from '../../../core/models/api-response.model';
import { ProductResponse } from '../../products/models/product.model';
import { LocationResponse } from '../../locations/models/location.model';
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
  private readonly productsUrl = `${environment.apiUrl}/products`;
  private readonly locationsUrl = `${environment.apiUrl}/locations`;

  // ── Writable state ────────────────────────────────────────────────────────
  private readonly _inventoryList = signal<InventoryResponse[]>([]);
  private readonly _movements = signal<MovementResponse[]>([]);
  private readonly _isLoading = signal<boolean>(false);
  private readonly _isLoadingMovements = signal<boolean>(false);
  private readonly _totalElements = signal<number>(0);
  private readonly _totalPages = signal<number>(0);
  private readonly _currentPage = signal<number>(1);
  private readonly _movementTotalElements = signal<number>(0);
  private readonly _movementTotalPages = signal<number>(0);
  private readonly _movementCurrentPage = signal<number>(1);

  // ── Public read-only signals ───────────────────────────────────────────────
  readonly inventoryList = this._inventoryList.asReadonly();
  readonly movements = this._movements.asReadonly();
  readonly isLoading = this._isLoading.asReadonly();
  readonly isLoadingMovements = this._isLoadingMovements.asReadonly();
  readonly totalElements = this._totalElements.asReadonly();
  readonly totalPages = this._totalPages.asReadonly();
  readonly currentPage = this._currentPage.asReadonly();
  readonly movementTotalElements = this._movementTotalElements.asReadonly();
  readonly movementTotalPages = this._movementTotalPages.asReadonly();
  readonly movementCurrentPage = this._movementCurrentPage.asReadonly();

  constructor(private readonly http: HttpClient) {}

  /**
   * Load a paginated inventory view. Supports filtering by location,
   * product, category, stock status, and free-text search.
   * Updates `inventoryList`, pagination, and `isLoading` signals.
   */
  loadInventory(params: InventoryListParams = {}): Observable<PagedResponse<InventoryResponse>> {
    this._isLoading.set(true);
    return this.getInventory(params).pipe(
      tap((res) => {
        this._inventoryList.set(res.data);
        this._totalElements.set(res.pagination.totalElements);
        this._totalPages.set(res.pagination.totalPages);
        this._currentPage.set(res.pagination.page);
      }),
      finalize(() => this._isLoading.set(false))
    );
  }

  /**
   * Load movement history and update movement signals.
   */
  loadMovements(params: MovementListParams = {}): Observable<PagedResponse<MovementResponse>> {
    this._isLoadingMovements.set(true);
    return this.getMovements(params).pipe(
      tap((res) => {
        this._movements.set(res.data);
        this._movementTotalElements.set(res.pagination.totalElements);
        this._movementTotalPages.set(res.pagination.totalPages);
        this._movementCurrentPage.set(res.pagination.page);
      }),
      finalize(() => this._isLoadingMovements.set(false))
    );
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

  // ── Lookup methods for forms ──────────────────────────────────────────────

  getProductOptions(search?: string): Observable<PagedResponse<ProductResponse>> {
    let httpParams = new HttpParams()
      .set('active', 'true')
      .set('sortBy', 'name')
      .set('sortDir', 'asc')
      .set('page', '1')
      .set('size', '500');

    if (search?.trim()) {
      httpParams = httpParams.set('search', search.trim());
    }

    return this.http.get<PagedResponse<ProductResponse>>(this.productsUrl, { params: httpParams });
  }

  getLocationOptions(): Observable<PagedResponse<LocationResponse>> {
    const httpParams = new HttpParams()
      .set('active', 'true')
      .set('sortBy', 'name')
      .set('sortDir', 'asc')
      .set('page', '1')
      .set('size', '500');

    return this.http.get<PagedResponse<LocationResponse>>(this.locationsUrl, { params: httpParams });
  }
}
