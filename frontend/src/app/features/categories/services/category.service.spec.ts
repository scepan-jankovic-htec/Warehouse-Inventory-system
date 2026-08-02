import '@angular/compiler';
import { of, throwError } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';
import { CategoryService } from './category.service';

describe('CategoryService', () => {
  it('getCategories forwards filter and paging params to http', () => {
    let capturedOptions: { params: { get: (key: string) => string | null } } | undefined;
    const httpClientMock = {
      get: vi.fn((_: string, options?: { params: { get: (key: string) => string | null } }) => {
        capturedOptions = options;
        return of({ data: [], pagination: { page: 2, size: 50, totalElements: 0, totalPages: 0 } });
      }),
      post: vi.fn(() => of({ data: {} })),
      put: vi.fn(() => of({ data: {} })),
      patch: vi.fn(() => of(void 0)),
    };

    const service = new CategoryService(httpClientMock as never);

    service.getCategories({ search: 'elec', active: true, sortBy: 'name', sortDir: 'asc', page: 2, size: 50 }).subscribe();

  expect(capturedOptions).toBeDefined();
  const options = capturedOptions!;
    expect(options.params.get('search')).toBe('elec');
    expect(options.params.get('active')).toBe('true');
    expect(options.params.get('sortBy')).toBe('name');
    expect(options.params.get('sortDir')).toBe('asc');
    expect(options.params.get('page')).toBe('2');
    expect(options.params.get('size')).toBe('50');
  });

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

    expect(service.isLoading()).toBe(false);
    expect(service.categories().length).toBe(2);
    expect(service.totalElements()).toBe(2);
    expect(service.totalPages()).toBe(1);
    expect(service.currentPage()).toBe(1);
    expect(service.activeCategories().length).toBe(1);
  });

  it('loadCategory updates selectedCategory and clears loading flag', () => {
    const httpClientMock = {
      get: vi.fn(() =>
        of({
          data: {
            id: 4,
            name: 'Food',
            description: null,
            active: true,
            productCount: 9,
            createdAt: '2026-08-01T00:00:00Z',
            updatedAt: '2026-08-01T00:00:00Z',
          },
        })
      ),
      post: vi.fn(() => of({ data: {} })),
      put: vi.fn(() => of({ data: {} })),
      patch: vi.fn(() => of(void 0)),
    };

    const service = new CategoryService(httpClientMock as never);

    service.loadCategory(4).subscribe();

    expect(service.selectedCategory()?.id).toBe(4);
    expect(service.isLoading()).toBe(false);
  });

  it('loadCategories leaves loading true when upstream errors', () => {
    const httpClientMock = {
      get: vi.fn(() => throwError(() => new Error('boom'))),
      post: vi.fn(() => of({ data: {} })),
      put: vi.fn(() => of({ data: {} })),
      patch: vi.fn(() => of(void 0)),
    };

    const service = new CategoryService(httpClientMock as never);

    service.loadCategories().subscribe({ error: () => undefined });

    expect(service.isLoading()).toBe(true);
  });

  it('createCategory and updateCategory delegate to http client', () => {
    const httpClientMock = {
      get: vi.fn(() => of({ data: [], pagination: { page: 1, size: 20, totalElements: 0, totalPages: 0 } })),
      post: vi.fn(() => of({ data: { id: 2 } })),
      put: vi.fn(() => of({ data: { id: 2 } })),
      patch: vi.fn(() => of(void 0)),
    };

    const service = new CategoryService(httpClientMock as never);

    service.createCategory({ name: 'Food', description: 'Shelf stable' }).subscribe();
    service.updateCategory(2, { name: 'Food Updated', description: 'Dry goods' }).subscribe();

    expect(httpClientMock.post).toHaveBeenCalledWith(expect.stringContaining('/categories'), {
      name: 'Food',
      description: 'Shelf stable',
    });
    expect(httpClientMock.put).toHaveBeenCalledWith(expect.stringContaining('/categories/2'), {
      name: 'Food Updated',
      description: 'Dry goods',
    });
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

  it('deactivateCategory updates selectedCategory when same id is loaded', () => {
    const httpClientMock = {
      get: vi.fn()
        .mockReturnValueOnce(
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
        )
        .mockReturnValueOnce(
          of({
            data: {
              id: 1,
              name: 'Electronics',
              description: null,
              active: true,
              productCount: 3,
              createdAt: '2026-08-01T00:00:00Z',
              updatedAt: '2026-08-01T00:00:00Z',
            },
          })
        ),
      post: vi.fn(() => of({ data: {} })),
      put: vi.fn(() => of({ data: {} })),
      patch: vi.fn(() => of(void 0)),
    };

    const service = new CategoryService(httpClientMock as never);

    service.loadCategories().subscribe();
    service.loadCategory(1).subscribe();
    service.deactivateCategory(1).subscribe();

    expect(service.selectedCategory()?.active).toBe(false);
  });
});
