import '@angular/compiler';
import { of } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';
import { InventoryService } from './inventory.service';

describe('InventoryService', () => {
  it('loads inventory and updates list + pagination signals', () => {
    const httpClientMock = {
      get: vi.fn((url: string) => {
        if (url.includes('/inventory')) {
          return of({
            data: [
              {
                id: 1,
                product: { id: 10, sku: 'BAT-AA-4P', name: 'AA Battery', unitOfMeasure: 'PACK', reorderThreshold: 50 },
                location: { id: 1, name: 'Warehouse A', type: 'WAREHOUSE' },
                quantityOnHand: 120,
                stockStatus: 'IN_STOCK',
                updatedAt: '2026-08-02T10:00:00Z',
              },
            ],
            pagination: { page: 1, size: 20, totalElements: 1, totalPages: 1 },
          });
        }
        return of({ data: [], pagination: { page: 1, size: 20, totalElements: 0, totalPages: 0 } });
      }),
      post: vi.fn(() => of({ data: {} })),
      patch: vi.fn(() => of(void 0)),
      put: vi.fn(() => of({ data: {} })),
    };

    const service = new InventoryService(httpClientMock as never);

    service.loadInventory({ page: 1, size: 20 }).subscribe();

    expect(service.inventoryList().length).toBe(1);
    expect(service.totalElements()).toBe(1);
    expect(service.totalPages()).toBe(1);
    expect(service.currentPage()).toBe(1);
  });

  it('loads movements and updates movement signals', () => {
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
            pagination: { page: 1, size: 10, totalElements: 1, totalPages: 1 },
          });
        }
        return of({ data: [], pagination: { page: 1, size: 10, totalElements: 0, totalPages: 0 } });
      }),
      post: vi.fn(() => of({ data: {} })),
      patch: vi.fn(() => of(void 0)),
      put: vi.fn(() => of({ data: {} })),
    };

    const service = new InventoryService(httpClientMock as never);

    service.loadMovements({ page: 1, size: 10 }).subscribe();

    expect(service.movements().length).toBe(1);
    expect(service.movementTotalElements()).toBe(1);
    expect(service.movementTotalPages()).toBe(1);
  });
});
