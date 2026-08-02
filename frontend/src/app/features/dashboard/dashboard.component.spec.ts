import '@angular/compiler';
import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';
import { DashboardService } from './services/dashboard.service';
import { DashboardComponent } from './dashboard.component';

describe('DashboardComponent', () => {
  it('calls loadDashboard on init', () => {
    const dashboardServiceMock = {
      summary: signal(null),
      totalStock: signal(0),
      stockPerCategory: signal([]),
      isLoading: signal(false),
      loadDashboard: vi.fn(() => of(void 0)),
    };

    TestBed.configureTestingModule({
      imports: [DashboardComponent],
      providers: [{ provide: DashboardService, useValue: dashboardServiceMock }],
    });

    const fixture = TestBed.createComponent(DashboardComponent);
    fixture.detectChanges();

    expect(dashboardServiceMock.loadDashboard).toHaveBeenCalledTimes(1);
  });
});
