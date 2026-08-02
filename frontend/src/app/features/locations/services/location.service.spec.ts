import '@angular/compiler';
import { of } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';
import { LocationService } from './location.service';

describe('LocationService', () => {
  it('loadLocations — successful response — updates list and pagination signals', () => {
    const httpClientMock = {
      get: vi.fn(() =>
        of({
          data: [
            {
              id: 1,
              name: 'Warehouse A',
              type: 'WAREHOUSE',
              address: 'Main road',
              active: true,
              createdAt: '2026-08-01T00:00:00Z',
              updatedAt: '2026-08-01T00:00:00Z',
            },
          ],
          pagination: { page: 1, size: 20, totalElements: 1, totalPages: 1 },
        })
      ),
      post: vi.fn(() => of({ data: {} })),
      put: vi.fn(() => of({ data: {} })),
      patch: vi.fn(() => of(void 0)),
    };

    const service = new LocationService(httpClientMock as never);

    service.loadLocations({ page: 1, size: 20, type: 'WAREHOUSE' }).subscribe();

    expect(service.locations().length).toBe(1);
    expect(service.totalElements()).toBe(1);
    expect(service.totalPages()).toBe(1);
    expect(service.currentPage()).toBe(1);
  });

  it('deactivateLocation and activateLocation — list state — toggles active flag', () => {
    const httpClientMock = {
      get: vi.fn(() =>
        of({
          data: [
            {
              id: 10,
              name: 'Store 01',
              type: 'STORE',
              address: null,
              active: true,
              createdAt: '2026-08-01T00:00:00Z',
              updatedAt: '2026-08-01T00:00:00Z',
            },
          ],
          pagination: { page: 1, size: 20, totalElements: 1, totalPages: 1 },
        })
      ),
      post: vi.fn(() => of({ data: {} })),
      put: vi.fn(() => of({ data: {} })),
      patch: vi.fn(() => of(void 0)),
    };

    const service = new LocationService(httpClientMock as never);

    service.loadLocations({ page: 1, size: 20 }).subscribe();

    service.deactivateLocation(10).subscribe();
    expect(service.locations()[0]?.active).toBe(false);

    service.activateLocation(10).subscribe();
    expect(service.locations()[0]?.active).toBe(true);
  });
});
