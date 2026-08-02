import '@angular/compiler';
import { of } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';
import { DashboardService } from './dashboard.service';

describe('DashboardService', () => {
  it('loadDashboard updates summary, total stock, and stock-per-category signals', () => {
    const httpClientMock = {
      get: vi.fn((url: string, options?: { params?: Record<string, string> }) => {
        if (url.includes('/dashboard/summary')) {
          return of({
            data: {
              totalActiveProducts: 3,
              totalActiveLocations: 2,
              lowStockCount: 1,
              outOfStockCount: 0,
              recentMovements: [],
            },
          });
        }

        if (url.includes('/dashboard/stock-health')) {
          return of({ data: [] });
        }

        if (url.includes('/products')) {
          return of({
            data: [
              {
                id: 10,
                sku: 'BAT-AA-4P',
                name: 'AA Battery 4-Pack',
                description: null,
                category: { id: 1, name: 'Electronics' },
                unitOfMeasure: 'PACK',
                reorderThreshold: 50,
                active: true,
                createdAt: '2026-08-01T00:00:00Z',
                updatedAt: '2026-08-01T00:00:00Z',
              },
              {
                id: 11,
                sku: 'PEN-BLUE',
                name: 'Blue Pen',
                description: null,
                category: { id: 2, name: 'Stationery' },
                unitOfMeasure: 'PCS',
                reorderThreshold: 20,
                active: true,
                createdAt: '2026-08-01T00:00:00Z',
                updatedAt: '2026-08-01T00:00:00Z',
              },
            ],
            pagination: { page: 1, size: 100, totalElements: 2, totalPages: 1 },
          });
        }

        if (url.includes('/inventory')) {
          const page = Number(options?.params?.['page'] ?? '1');
          if (page === 1) {
            return of({
              data: [
                {
                  id: 100,
                  product: { id: 10, sku: 'BAT-AA-4P', name: 'AA Battery 4-Pack', unitOfMeasure: 'PACK', reorderThreshold: 50 },
                  location: { id: 1, name: 'Warehouse A', type: 'WAREHOUSE' },
                  quantityOnHand: 120,
                  stockStatus: 'IN_STOCK',
                  updatedAt: '2026-08-02T08:00:00Z',
                },
              ],
              pagination: { page: 1, size: 100, totalElements: 2, totalPages: 2 },
            });
          }

          return of({
            data: [
              {
                id: 101,
                product: { id: 11, sku: 'PEN-BLUE', name: 'Blue Pen', unitOfMeasure: 'PCS', reorderThreshold: 20 },
                location: { id: 1, name: 'Warehouse A', type: 'WAREHOUSE' },
                quantityOnHand: 30,
                stockStatus: 'IN_STOCK',
                updatedAt: '2026-08-02T08:00:00Z',
              },
            ],
            pagination: { page: 2, size: 100, totalElements: 2, totalPages: 2 },
          });
        }

        return of({ data: [], pagination: { page: 1, size: 100, totalElements: 0, totalPages: 1 } });
      }),
    };

    const service = new DashboardService(httpClientMock as never);

    service.loadDashboard().subscribe();

    expect(service.summary()?.totalActiveProducts).toBe(3);
    expect(service.totalStock()).toBe(150);
    expect(service.stockPerCategory()).toEqual([
      { categoryId: 1, categoryName: 'Electronics', totalStock: 120 },
      { categoryId: 2, categoryName: 'Stationery', totalStock: 30 },
    ]);
  });
});
