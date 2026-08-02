import { Injectable, signal, computed } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { ApiResponse, PagedResponse } from '../../../core/models/api-response.model';
import {
  CategoryResponse,
  CategoryCreateRequest,
  CategoryUpdateRequest,
} from '../models/category.model';

export interface CategoryListParams {
  search?: string;
  active?: boolean;
  sortBy?: string;
  sortDir?: 'asc' | 'desc';
  page?: number;
  size?: number;
}

@Injectable({
  providedIn: 'root',
})
export class CategoryService {
  private readonly baseUrl = `${environment.apiUrl}/categories`;

  // ── Writable state ────────────────────────────────────────────────────────
  private readonly _categories = signal<CategoryResponse[]>([]);
  private readonly _selectedCategory = signal<CategoryResponse | null>(null);
  private readonly _isLoading = signal<boolean>(false);
  private readonly _totalElements = signal<number>(0);
  private readonly _totalPages = signal<number>(0);
  private readonly _currentPage = signal<number>(1);

  // ── Public read-only signals ───────────────────────────────────────────────
  readonly categories = this._categories.asReadonly();
  readonly selectedCategory = this._selectedCategory.asReadonly();
  readonly isLoading = this._isLoading.asReadonly();
  readonly totalElements = this._totalElements.asReadonly();
  readonly totalPages = this._totalPages.asReadonly();
  readonly currentPage = this._currentPage.asReadonly();

  /** Derived: only active categories — useful for dropdown selectors */
  readonly activeCategories = computed(() =>
    this._categories().filter((c) => c.active)
  );

  constructor(private readonly http: HttpClient) {}

  /**
   * Load a paginated, optionally-filtered list of categories.
   * Updates the `categories`, pagination, and `isLoading` signals.
   */
  loadCategories(params: CategoryListParams = {}): void {
    this._isLoading.set(true);
    this.getCategories(params).subscribe({
      next: (res) => {
        this._categories.set(res.data);
        this._totalElements.set(res.pagination.totalElements);
        this._totalPages.set(res.pagination.totalPages);
        this._currentPage.set(res.pagination.page);
        this._isLoading.set(false);
      },
      error: () => this._isLoading.set(false),
    });
  }

  /**
   * Load a single category by ID.
   * Updates the `selectedCategory` signal.
   */
  loadCategory(id: number): void {
    this._isLoading.set(true);
    this.getCategory(id).subscribe({
      next: (res) => {
        this._selectedCategory.set(res.data);
        this._isLoading.set(false);
      },
      error: () => this._isLoading.set(false),
    });
  }

  // ── HTTP methods (return Observables for caller-controlled error handling) ─

  getCategories(params: CategoryListParams = {}): Observable<PagedResponse<CategoryResponse>> {
    let httpParams = new HttpParams();
    if (params.search) httpParams = httpParams.set('search', params.search);
    if (params.active !== undefined) httpParams = httpParams.set('active', String(params.active));
    if (params.sortBy) httpParams = httpParams.set('sortBy', params.sortBy);
    if (params.sortDir) httpParams = httpParams.set('sortDir', params.sortDir);
    if (params.page !== undefined) httpParams = httpParams.set('page', String(params.page));
    if (params.size !== undefined) httpParams = httpParams.set('size', String(params.size));
    return this.http.get<PagedResponse<CategoryResponse>>(this.baseUrl, { params: httpParams });
  }

  getCategory(id: number): Observable<ApiResponse<CategoryResponse>> {
    return this.http.get<ApiResponse<CategoryResponse>>(`${this.baseUrl}/${id}`);
  }

  createCategory(body: CategoryCreateRequest): Observable<ApiResponse<CategoryResponse>> {
    return this.http.post<ApiResponse<CategoryResponse>>(this.baseUrl, body);
  }

  updateCategory(id: number, body: CategoryUpdateRequest): Observable<ApiResponse<CategoryResponse>> {
    return this.http.put<ApiResponse<CategoryResponse>>(`${this.baseUrl}/${id}`, body);
  }

  deactivateCategory(id: number): Observable<void> {
    return this.http.patch<void>(`${this.baseUrl}/${id}/deactivate`, null).pipe(
      tap(() => {
        // Reflect deactivation in the local list without a full reload
        this._categories.update((list) =>
          list.map((c) => (c.id === id ? { ...c, active: false } : c))
        );
        if (this._selectedCategory()?.id === id) {
          this._selectedCategory.update((c) => (c ? { ...c, active: false } : null));
        }
      })
    );
  }

  activateCategory(id: number): Observable<void> {
    return this.http.patch<void>(`${this.baseUrl}/${id}/activate`, null).pipe(
      tap(() => {
        this._categories.update((list) =>
          list.map((c) => (c.id === id ? { ...c, active: true } : c))
        );
        if (this._selectedCategory()?.id === id) {
          this._selectedCategory.update((c) => (c ? { ...c, active: true } : null));
        }
      })
    );
  }
}
