import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { ApiResponse } from '../../../core/models/api-response.model';
import {
  DashboardSummaryResponse,
  StockHealthResponse,
} from '../models/dashboard.model';

@Injectable({
  providedIn: 'root',
})
export class DashboardService {
  private readonly baseUrl = `${environment.apiUrl}/dashboard`;

  // ── Writable state ────────────────────────────────────────────────────────
  private readonly _summary = signal<DashboardSummaryResponse | null>(null);
  private readonly _stockHealth = signal<StockHealthResponse[]>([]);
  private readonly _isLoading = signal<boolean>(false);

  // ── Public read-only signals ───────────────────────────────────────────────
  readonly summary = this._summary.asReadonly();
  readonly stockHealth = this._stockHealth.asReadonly();
  readonly isLoading = this._isLoading.asReadonly();

  constructor(private readonly http: HttpClient) {}

  /**
   * Load both dashboard widgets in parallel.
   * `summary` and `stockHealth` signals are updated independently so the UI
   * can render each card as soon as its data arrives.
   */
  loadDashboard(): void {
    this._isLoading.set(true);
    let pending = 2;
    const done = () => { if (--pending === 0) this._isLoading.set(false); };

    this.getSummary().subscribe({
      next: (res) => { this._summary.set(res.data); done(); },
      error: () => done(),
    });

    this.getStockHealth().subscribe({
      next: (res) => { this._stockHealth.set(res.data); done(); },
      error: () => done(),
    });
  }

  // ── HTTP methods ──────────────────────────────────────────────────────────

  /**
   * Returns high-level inventory metrics:
   * total active products/locations, low-stock count, out-of-stock count,
   * and the 10 most recent movements.
   */
  getSummary(): Observable<ApiResponse<DashboardSummaryResponse>> {
    return this.http.get<ApiResponse<DashboardSummaryResponse>>(`${this.baseUrl}/summary`);
  }

  /**
   * Returns stock health distribution broken down by location
   * (in-stock, low-stock, out-of-stock counts per location).
   * Response is a plain array, not paginated.
   */
  getStockHealth(): Observable<ApiResponse<StockHealthResponse[]>> {
    return this.http.get<ApiResponse<StockHealthResponse[]>>(`${this.baseUrl}/stock-health`);
  }
}
}
