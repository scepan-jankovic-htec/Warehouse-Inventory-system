import { Injectable, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { ApiResponse, PagedResponse } from '../../../core/models/api-response.model';
import {
  ProductResponse,
  ProductDetailResponse,
  ProductCreateRequest,
  ProductUpdateRequest,
} from '../models/product.model';

export interface ProductListParams {
  search?: string;
  categoryId?: number;
  active?: boolean;
  sortBy?: string;
  sortDir?: 'asc' | 'desc';
  page?: number;
  size?: number;
}

@Injectable({
  providedIn: 'root',
})
export class ProductService {
  private readonly baseUrl = `${environment.apiUrl}/products`;

  // ── Writable state ────────────────────────────────────────────────────────
  private readonly _products = signal<ProductResponse[]>([]);
  private readonly _selectedProduct = signal<ProductDetailResponse | null>(null);
  private readonly _isLoading = signal<boolean>(false);
  private readonly _totalElements = signal<number>(0);
  private readonly _totalPages = signal<number>(0);
  private readonly _currentPage = signal<number>(1);

  // ── Public read-only signals ───────────────────────────────────────────────
  readonly products = this._products.asReadonly();
  readonly selectedProduct = this._selectedProduct.asReadonly();
  readonly isLoading = this._isLoading.asReadonly();
  readonly totalElements = this._totalElements.asReadonly();
  readonly totalPages = this._totalPages.asReadonly();
  readonly currentPage = this._currentPage.asReadonly();

  constructor(private readonly http: HttpClient) {}

  /**
   * Load a paginated, optionally-filtered list of products.
   * Updates the `products`, pagination, and `isLoading` signals.
   */
  loadProducts(params: ProductListParams = {}): void {
    this._isLoading.set(true);
    this.getProducts(params).subscribe({
      next: (res) => {
        this._products.set(res.data);
        this._totalElements.set(res.pagination.totalElements);
        this._totalPages.set(res.pagination.totalPages);
        this._currentPage.set(res.pagination.page);
        this._isLoading.set(false);
      },
      error: () => this._isLoading.set(false),
    });
  }

  /**
   * Load a single product by ID, including per-location inventory.
   * Updates the `selectedProduct` signal.
   */
  loadProduct(id: number): void {
    this._isLoading.set(true);
    this.getProduct(id).subscribe({
      next: (res) => {
        this._selectedProduct.set(res.data);
        this._isLoading.set(false);
      },
      error: () => this._isLoading.set(false),
    });
  }

  // ── HTTP methods ──────────────────────────────────────────────────────────

  getProducts(params: ProductListParams = {}): Observable<PagedResponse<ProductResponse>> {
    let httpParams = new HttpParams();
    if (params.search) httpParams = httpParams.set('search', params.search);
    if (params.categoryId !== undefined) httpParams = httpParams.set('categoryId', String(params.categoryId));
    if (params.active !== undefined) httpParams = httpParams.set('active', String(params.active));
    if (params.sortBy) httpParams = httpParams.set('sortBy', params.sortBy);
    if (params.sortDir) httpParams = httpParams.set('sortDir', params.sortDir);
    if (params.page !== undefined) httpParams = httpParams.set('page', String(params.page));
    if (params.size !== undefined) httpParams = httpParams.set('size', String(params.size));
    return this.http.get<PagedResponse<ProductResponse>>(this.baseUrl, { params: httpParams });
  }

  getProduct(id: number): Observable<ApiResponse<ProductDetailResponse>> {
    return this.http.get<ApiResponse<ProductDetailResponse>>(`${this.baseUrl}/${id}`);
  }

  createProduct(body: ProductCreateRequest): Observable<ApiResponse<ProductDetailResponse>> {
    return this.http.post<ApiResponse<ProductDetailResponse>>(this.baseUrl, body);
  }

  updateProduct(id: number, body: ProductUpdateRequest): Observable<ApiResponse<ProductDetailResponse>> {
    return this.http.put<ApiResponse<ProductDetailResponse>>(`${this.baseUrl}/${id}`, body);
  }

  deactivateProduct(id: number): Observable<void> {
    return this.http.patch<void>(`${this.baseUrl}/${id}/deactivate`, null).pipe(
      tap(() =>
        this._products.update((list) =>
          list.map((p) => (p.id === id ? { ...p, active: false } : p))
        )
      )
    );
  }

  activateProduct(id: number): Observable<void> {
    return this.http.patch<void>(`${this.baseUrl}/${id}/activate`, null).pipe(
      tap(() =>
        this._products.update((list) =>
          list.map((p) => (p.id === id ? { ...p, active: true } : p))
        )
      )
    );
  }
}
}
