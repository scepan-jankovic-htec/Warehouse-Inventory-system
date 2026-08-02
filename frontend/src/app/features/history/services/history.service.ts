import { Injectable, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { finalize, Observable, tap, throwError } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { MovementType } from '../../../core/models/api-enums.model';
import { PagedResponse } from '../../../core/models/api-response.model';
import { LocationResponse } from '../../locations/models/location.model';
import { ProductResponse } from '../../products/models/product.model';
import { HistoryEntryModel } from '../models/history-entry.model';

export interface HistoryListParams {
  productId?: number;
  locationId?: number;
  movementType?: MovementType;
  performedBy?: number;
  dateFrom?: string;
  dateTo?: string;
  sortBy?: 'performedAt' | 'quantityDelta';
  sortDir?: 'asc' | 'desc';
  page?: number;
  size?: number;
}

@Injectable({
  providedIn: 'root'
})
export class HistoryService {
  private readonly baseUrl = `${environment.apiUrl}/inventory/movements`;
  private readonly productsUrl = `${environment.apiUrl}/products`;
  private readonly locationsUrl = `${environment.apiUrl}/locations`;

  private readonly historyState = signal<HistoryEntryModel[]>([]);
  private readonly isLoadingState = signal<boolean>(false);
  private readonly totalElementsState = signal<number>(0);
  private readonly totalPagesState = signal<number>(0);
  private readonly currentPageState = signal<number>(1);

  private readonly lastQueryState = signal<HistoryListParams>({
    sortBy: 'performedAt',
    sortDir: 'desc',
    page: 1,
    size: 20,
  });

  readonly history = this.historyState.asReadonly();
  readonly isLoading = this.isLoadingState.asReadonly();
  readonly totalElements = this.totalElementsState.asReadonly();
  readonly totalPages = this.totalPagesState.asReadonly();
  readonly currentPage = this.currentPageState.asReadonly();
  readonly lastQuery = this.lastQueryState.asReadonly();

  constructor(private readonly http: HttpClient) {}

  loadAll(params: HistoryListParams = {}): Observable<PagedResponse<HistoryEntryModel>> {
    const mergedParams: HistoryListParams = {
      ...this.lastQueryState(),
      ...params,
    };

    if (this.hasInvalidDateRange(mergedParams.dateFrom, mergedParams.dateTo)) {
      return throwError(() => new Error('dateFrom must not be after dateTo.'));
    }

    this.lastQueryState.set(mergedParams);
    this.isLoadingState.set(true);

    return this.getAll(mergedParams).pipe(
      tap((res) => {
        this.historyState.set(res.data);
        this.totalElementsState.set(res.pagination.totalElements);
        this.totalPagesState.set(res.pagination.totalPages);
        this.currentPageState.set(res.pagination.page);
      }),
      finalize(() => this.isLoadingState.set(false))
    );
  }

  getAll(params: HistoryListParams = {}): Observable<PagedResponse<HistoryEntryModel>> {
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

    return this.http.get<PagedResponse<HistoryEntryModel>>(this.baseUrl, { params: httpParams });
  }

  getProductOptions(): Observable<PagedResponse<ProductResponse>> {
    const httpParams = new HttpParams()
      .set('active', 'true')
      .set('sortBy', 'name')
      .set('sortDir', 'asc')
      .set('page', '1')
      .set('size', '500');

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

  private hasInvalidDateRange(dateFrom?: string, dateTo?: string): boolean {
    if (!dateFrom || !dateTo) {
      return false;
    }

    return new Date(dateFrom).getTime() > new Date(dateTo).getTime();
  }
}
