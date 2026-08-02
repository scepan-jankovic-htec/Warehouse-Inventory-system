import { Injectable, signal } from '@angular/core';
import { DashboardModel } from '../models/dashboard.model';

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private readonly dashboardState = signal<DashboardModel | null>(null);

  readonly dashboard = this.dashboardState.asReadonly();
}
