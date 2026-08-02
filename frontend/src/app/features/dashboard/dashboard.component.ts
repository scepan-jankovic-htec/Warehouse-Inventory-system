import { Component, OnInit, inject, signal } from '@angular/core';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner/loading-spinner.component';
import { DashboardService } from './services/dashboard.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [EmptyStateComponent, LoadingSpinnerComponent],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
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
