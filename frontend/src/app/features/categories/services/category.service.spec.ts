import '@angular/compiler';
import { of } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';
import { CategoryService } from './category.service';

describe('CategoryService', () => {
  it('loadCategories — successful response — updates list and pagination signals', () => {
    const httpClientMock = {
      get: vi.fn(() =>
        of({
          data: [
            {
              id: 1,
              name: 'Electronics',
              description: null,
              active: true,
              productCount: 3,
              createdAt: '2026-08-01T00:00:00Z',
              updatedAt: '2026-08-01T00:00:00Z',
            },
            {
              id: 2,
              name: 'Stationery',
              description: null,
              active: false,
              productCount: 2,
              createdAt: '2026-08-01T00:00:00Z',
              updatedAt: '2026-08-01T00:00:00Z',
            },
          ],
          pagination: { page: 1, size: 20, totalElements: 2, totalPages: 1 },
        })
      ),
      post: vi.fn(() => of({ data: {} })),
      put: vi.fn(() => of({ data: {} })),
      patch: vi.fn(() => of(void 0)),
    };

    const service = new CategoryService(httpClientMock as never);

    service.loadCategories({ page: 1, size: 20 }).subscribe();

    expect(service.categories().length).toBe(2);
    expect(service.totalElements()).toBe(2);
    expect(service.totalPages()).toBe(1);
    expect(service.currentPage()).toBe(1);
    expect(service.activeCategories().length).toBe(1);
  });

  it('deactivateCategory and activateCategory — selected and list state — toggles active flag', () => {
    const httpClientMock = {
      get: vi.fn(() =>
        of({
          data: [
            {
              id: 1,
              name: 'Electronics',
              description: null,
              active: true,
              productCount: 3,
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

    const service = new CategoryService(httpClientMock as never);

    service.loadCategories({ page: 1, size: 20 }).subscribe();
    service.loadCategory(1).subscribe();

    service.deactivateCategory(1).subscribe();
    expect(service.categories()[0]?.active).toBe(false);

    service.activateCategory(1).subscribe();
    expect(service.categories()[0]?.active).toBe(true);
  });
});
