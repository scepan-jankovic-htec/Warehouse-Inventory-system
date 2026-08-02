import '@angular/compiler';
import { of } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';
import { HistoryService } from './history.service';

describe('HistoryService', () => {
  it('loads history and updates list + pagination signals', () => {
    const httpClientMock = {
      get: vi.fn((url: string) => {
        if (url.includes('/inventory/movements')) {
          return of({
            data: [
              {
                id: 901,
                movementType: 'RECEIVE',
                product: { id: 10, sku: 'BAT-AA-4P', name: 'AA Battery' },
                location: { id: 1, name: 'Warehouse A', type: 'WAREHOUSE' },
                quantityDelta: 20,
                referenceId: 'PO-1',
                reason: 'Restock',
                transferCounterpartId: null,
                performedBy: { id: 1, username: 'admin', fullName: 'Admin User' },
                performedAt: '2026-08-02T10:00:00Z',
              },
            ],
            pagination: { page: 1, size: 20, totalElements: 1, totalPages: 1 },
          });
        }

        return of({ data: [], pagination: { page: 1, size: 20, totalElements: 0, totalPages: 0 } });
      }),
    };

    const service = new HistoryService(httpClientMock as never);

    service.loadAll({ page: 1, size: 20 }).subscribe();

    expect(service.history().length).toBe(1);
    expect(service.totalElements()).toBe(1);
    expect(service.totalPages()).toBe(1);
    expect(service.currentPage()).toBe(1);
  });

  it('rejects invalid date range and skips HTTP request', () => {
    const httpClientMock = {
      get: vi.fn(() => of({ data: [], pagination: { page: 1, size: 20, totalElements: 0, totalPages: 0 } })),
    };

    const service = new HistoryService(httpClientMock as never);

    let hasError = false;
    service
      .loadAll({ dateFrom: '2026-08-10T00:00:00', dateTo: '2026-08-02T23:59:59' })
      .subscribe({ error: () => (hasError = true) });

    expect(hasError).toBe(true);
    expect(httpClientMock.get).not.toHaveBeenCalled();
  });
});
