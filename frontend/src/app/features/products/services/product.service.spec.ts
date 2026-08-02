import '@angular/compiler';
import { of } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';
import { ProductService } from './product.service';

describe('ProductService', () => {
  it('loads list and updates product + pagination signals', () => {
    const httpClientMock = {
      get: vi.fn(() =>
        of({
          data: [
            {
              id: 1,
              sku: 'BAT-AA-4P',
              name: 'AA Battery 4-Pack',
              description: null,
              category: { id: 3, name: 'Electronics' },
              unitOfMeasure: 'PACK',
              reorderThreshold: 10,
              active: true,
              createdAt: '2026-08-01T10:00:00Z',
              updatedAt: '2026-08-01T10:00:00Z',
            },
          ],
          pagination: { page: 1, size: 20, totalElements: 1, totalPages: 1 },
        })
      ),
      post: vi.fn(),
      put: vi.fn(),
      patch: vi.fn(),
    };

    const service = new ProductService(httpClientMock as never);

    service.loadProducts({ page: 1, size: 20, sortBy: 'name', sortDir: 'asc' }).subscribe();

    expect(httpClientMock.get).toHaveBeenCalledTimes(1);
    expect(service.products().length).toBe(1);
    expect(service.totalElements()).toBe(1);
    expect(service.totalPages()).toBe(1);
    expect(service.currentPage()).toBe(1);
  });

  it('deactivates product and updates signal list entry', () => {
    const httpClientMock = {
      get: vi.fn(() =>
        of({
          data: [
            {
              id: 7,
              sku: 'P-7',
              name: 'Product 7',
              description: null,
              category: { id: 1, name: 'General' },
              unitOfMeasure: 'PCS',
              reorderThreshold: 5,
              active: true,
              createdAt: '2026-08-01T10:00:00Z',
              updatedAt: '2026-08-01T10:00:00Z',
            },
          ],
          pagination: { page: 1, size: 20, totalElements: 1, totalPages: 1 },
        })
      ),
      post: vi.fn(),
      put: vi.fn(),
      patch: vi.fn(() => of(void 0)),
    };

    const service = new ProductService(httpClientMock as never);

    service.loadProducts({ page: 1, size: 20 }).subscribe();
    service.deactivateProduct(7).subscribe();

    expect(httpClientMock.patch).toHaveBeenCalledTimes(1);
    expect(service.products()[0]?.active).toBe(false);
  });
});
