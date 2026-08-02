import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner/loading-spinner.component';
import { DashboardService } from './services/dashboard.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, EmptyStateComponent, LoadingSpinnerComponent],
  template: `
    <section class="page">
      <header class="header">
        <h1>Dashboard</h1>
      </header>

      <app-loading-spinner *ngIf="isLoading()" message="Loading dashboard..." />

      <section class="metrics" *ngIf="!isLoading()">
        <article class="metric-card">
          <p class="metric-label">Total products</p>
          <p class="metric-value">{{ summary()?.totalActiveProducts ?? 0 }}</p>
        </article>

        <article class="metric-card">
          <p class="metric-label">Total stock</p>
          <p class="metric-value">{{ formatNumber(totalStock()) }}</p>
        </article>
      </section>

      <section class="panel" *ngIf="!isLoading()">
        <h2>Stock per category</h2>

        <app-empty-state
          *ngIf="stockPerCategory().length === 0"
          title="No category stock data"
          description="No inventory rows are available to aggregate by category."
        />

        <div class="table-wrapper" *ngIf="stockPerCategory().length > 0">
          <table>
            <thead>
              <tr>
                <th>Category</th>
                <th class="num">Total stock</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let row of stockPerCategory()">
                <td>{{ row.categoryName }}</td>
                <td class="num">{{ formatNumber(row.totalStock) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

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

    .metrics {
      display: grid;
      grid-template-columns: repeat(2, minmax(220px, 1fr));
      gap: 12px;
    }

    .metric-card {
      background: #fff;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      padding: 16px;
    }

    .metric-label {
      margin: 0;
      color: #64748b;
      font-size: 13px;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }

    .metric-value {
      margin: 8px 0 0;
      color: #0f172a;
      font-size: 30px;
      font-weight: 700;
      line-height: 1.1;
    }

    .panel {
      background: #fff;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      padding: 14px;
      display: grid;
      gap: 10px;
    }

    .panel h2 {
      margin: 0;
      color: #0f172a;
      font-size: 20px;
    }

    .table-wrapper {
      overflow-x: auto;
    }

    table {
      width: 100%;
      min-width: 520px;
      border-collapse: collapse;
    }

    th,
    td {
      text-align: left;
      padding: 10px 12px;
      border-bottom: 1px solid #e2e8f0;
      font-size: 14px;
    }

    th {
      background: #f8fafc;
      color: #334155;
      font-weight: 600;
    }

    .num {
      text-align: right;
      font-variant-numeric: tabular-nums;
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

    @media (max-width: 720px) {
      .metrics {
        grid-template-columns: 1fr;
      }
    }
  `,
})
export class DashboardComponent implements OnInit {
  private readonly dashboardService = inject(DashboardService);

  readonly summary = this.dashboardService.summary;
  readonly totalStock = this.dashboardService.totalStock;
  readonly stockPerCategory = this.dashboardService.stockPerCategory;
  readonly isLoading = this.dashboardService.isLoading;
  readonly errorMessage = signal('');

  ngOnInit(): void {
    this.dashboardService.loadDashboard().subscribe({
      error: () => this.errorMessage.set('Failed to load dashboard metrics.'),
    });
  }

  formatNumber(value: number): string {
    return new Intl.NumberFormat('en-US').format(value);
  }
}
