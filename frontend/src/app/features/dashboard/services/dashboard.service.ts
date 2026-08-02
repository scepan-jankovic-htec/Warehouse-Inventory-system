import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { forkJoin, Observable, of } from 'rxjs';
import { finalize, map, switchMap, tap } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { ApiResponse, PagedResponse } from '../../../core/models/api-response.model';
import { InventoryResponse } from '../../inventory/models/inventory.model';
import { ProductResponse } from '../../products/models/product.model';
import {
  CategoryStockSummary,
  DashboardSummaryResponse,
  StockHealthResponse,
} from '../models/dashboard.model';

@Injectable({
  providedIn: 'root',
})
export class DashboardService {
  private readonly baseUrl = `${environment.apiUrl}/dashboard`;
  private readonly productsUrl = `${environment.apiUrl}/products`;
  private readonly inventoryUrl = `${environment.apiUrl}/inventory`;

  private readonly _summary = signal<DashboardSummaryResponse | null>(null);
  private readonly _stockHealth = signal<StockHealthResponse[]>([]);
  private readonly _totalStock = signal<number>(0);
  private readonly _stockPerCategory = signal<CategoryStockSummary[]>([]);
  private readonly _isLoading = signal<boolean>(false);

  readonly summary = this._summary.asReadonly();
  readonly stockHealth = this._stockHealth.asReadonly();
  readonly totalStock = this._totalStock.asReadonly();
  readonly stockPerCategory = this._stockPerCategory.asReadonly();
  readonly isLoading = this._isLoading.asReadonly();

  constructor(private readonly http: HttpClient) {}

  loadDashboard(): Observable<void> {
    this._isLoading.set(true);

    return forkJoin({
      summary: this.loadSummary(),
      stockHealth: this.loadStockHealth(),
      categoryTotals: this.loadCategoryTotals(),
    }).pipe(
      map(() => void 0),
      finalize(() => this._isLoading.set(false))
    );
  }

  loadSummary(): Observable<ApiResponse<DashboardSummaryResponse>> {
    return this.http
      .get<ApiResponse<DashboardSummaryResponse>>(`${this.baseUrl}/summary`)
      .pipe(tap((res) => this._summary.set(res.data)));
  }

  loadStockHealth(): Observable<ApiResponse<StockHealthResponse[]>> {
    return this.getStockHealth().pipe(tap((res) => this._stockHealth.set(res.data)));
  }

  loadCategoryTotals(): Observable<void> {
    return forkJoin({
      products: this.fetchAllProducts(),
      inventoryRows: this.fetchAllInventoryRows(),
    }).pipe(
      tap(({ products, inventoryRows }) => {
        const productById = new Map<number, ProductResponse>(products.map((product) => [product.id, product]));

        const categoryMap = new Map<string, CategoryStockSummary>();
        let totalStock = 0;

        for (const row of inventoryRows) {
          totalStock += row.quantityOnHand;

          const product = productById.get(row.product.id);
          const categoryId = product?.category?.id ?? null;
          const categoryName = product?.category?.name ?? 'Uncategorized';
          const key = categoryId === null ? `uncategorized:${categoryName}` : String(categoryId);

          const existing = categoryMap.get(key);
          if (existing) {
            existing.totalStock += row.quantityOnHand;
          } else {
            categoryMap.set(key, {
              categoryId,
              categoryName,
              totalStock: row.quantityOnHand,
            });
          }
        }

        const stockPerCategory = Array.from(categoryMap.values()).sort(
          (a, b) => b.totalStock - a.totalStock || a.categoryName.localeCompare(b.categoryName)
        );

        this._totalStock.set(totalStock);
        this._stockPerCategory.set(stockPerCategory);
      }),
      map(() => void 0)
    );
  }

  getStockHealth(): Observable<ApiResponse<StockHealthResponse[]>> {
    return this.http.get<ApiResponse<StockHealthResponse[]>>(`${this.baseUrl}/stock-health`);
  }

  private fetchAllProducts(): Observable<ProductResponse[]> {
    return this.fetchAllPages<ProductResponse>(this.productsUrl);
  }

  private fetchAllInventoryRows(): Observable<InventoryResponse[]> {
    return this.fetchAllPages<InventoryResponse>(this.inventoryUrl);
  }

  private fetchAllPages<T>(url: string): Observable<T[]> {
    const firstPage = 1;
    const pageSize = 100;

    return this.http
      .get<PagedResponse<T>>(url, { params: { page: String(firstPage), size: String(pageSize) } })
      .pipe(
        switchMap((firstResult) => {
          const pages = firstResult.pagination.totalPages;
          if (pages <= 1) {
            return of(firstResult.data);
          }

          const otherPageRequests: Observable<PagedResponse<T>>[] = [];
          for (let page = 2; page <= pages; page += 1) {
            otherPageRequests.push(
              this.http.get<PagedResponse<T>>(url, {
                params: { page: String(page), size: String(pageSize) },
              })
            );
          }

          return forkJoin(otherPageRequests).pipe(
            map((restPages) => [
              ...firstResult.data,
              ...restPages.flatMap((response) => response.data),
            ])
          );
        })
      );
  }
}
