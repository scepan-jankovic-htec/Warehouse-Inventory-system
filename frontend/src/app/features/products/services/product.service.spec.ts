import '@angular/compiler';
import { of, throwError } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';
import { ProductService } from './product.service';

describe('ProductService', () => {
  it('getProducts forwards filter and paging params to http', () => {
    let capturedOptions: { params: { get: (key: string) => string | null } } | undefined;
    const httpClientMock = {
      get: vi.fn((_: string, options?: { params: { get: (key: string) => string | null } }) => {
        capturedOptions = options;
        return of({ data: [], pagination: { page: 3, size: 25, totalElements: 0, totalPages: 0 } });
      }),
      post: vi.fn(),
      put: vi.fn(),
      patch: vi.fn(),
    };

    const service = new ProductService(httpClientMock as never);

    service.getProducts({ search: 'battery', categoryId: 4, active: true, sortBy: 'name', sortDir: 'desc', page: 3, size: 25 }).subscribe();

  expect(capturedOptions).toBeDefined();
  const options = capturedOptions!;
    expect(options.params.get('search')).toBe('battery');
    expect(options.params.get('categoryId')).toBe('4');
    expect(options.params.get('active')).toBe('true');
    expect(options.params.get('sortBy')).toBe('name');
    expect(options.params.get('sortDir')).toBe('desc');
    expect(options.params.get('page')).toBe('3');
    expect(options.params.get('size')).toBe('25');
  });

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
              price: 4.99,
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
    expect(service.isLoading()).toBe(false);
    expect(service.products().length).toBe(1);
    expect(service.totalElements()).toBe(1);
    expect(service.totalPages()).toBe(1);
    expect(service.currentPage()).toBe(1);
  });

  it('loadProducts clears loading flag on error via finalize', () => {
    const httpClientMock = {
      get: vi.fn(() => throwError(() => new Error('boom'))),
      post: vi.fn(),
      put: vi.fn(),
      patch: vi.fn(),
    };

    const service = new ProductService(httpClientMock as never);

    service.loadProducts().subscribe({ error: () => undefined });

    expect(service.isLoading()).toBe(false);
  });

  it('loadProduct updates selectedProduct and clears loading', () => {
    const detail = {
      id: 1,
      sku: 'BAT-AA-4P',
      name: 'AA Battery 4-Pack',
      description: null,
      category: { id: 3, name: 'Electronics' },
      unitOfMeasure: 'PACK',
      price: 4.99,
      reorderThreshold: 10,
      active: true,
      inventory: [],
      createdAt: '2026-08-01T10:00:00Z',
      updatedAt: '2026-08-01T10:00:00Z',
    };
    const httpClientMock = {
      get: vi.fn(() => of({ data: detail })),
      post: vi.fn(),
      put: vi.fn(),
      patch: vi.fn(),
    };

    const service = new ProductService(httpClientMock as never);

    service.loadProduct(1).subscribe();

    expect(service.selectedProduct()?.id).toBe(1);
    expect(service.isLoading()).toBe(false);
  });

  it('createProduct and updateProduct delegate to http client', () => {
    const httpClientMock = {
      get: vi.fn(),
      post: vi.fn(() => of({ data: { id: 1 } })),
      put: vi.fn(() => of({ data: { id: 1 } })),
      patch: vi.fn(),
    };

    const service = new ProductService(httpClientMock as never);

    service.createProduct({ sku: 'BAT-AA-4P', name: 'AA Battery 4-Pack', categoryId: 3, unitOfMeasure: 'PACK', price: 4.99, reorderThreshold: 10 }).subscribe();
    service.updateProduct(1, { name: 'AA Battery 8-Pack', categoryId: 3, unitOfMeasure: 'PACK', price: 6.99, reorderThreshold: 20 }).subscribe();

    expect(httpClientMock.post).toHaveBeenCalledWith(expect.stringContaining('/products'), {
      sku: 'BAT-AA-4P',
      name: 'AA Battery 4-Pack',
      categoryId: 3,
      unitOfMeasure: 'PACK',
      price: 4.99,
      reorderThreshold: 10,
    });
    expect(httpClientMock.put).toHaveBeenCalledWith(expect.stringContaining('/products/1'), {
      name: 'AA Battery 8-Pack',
      categoryId: 3,
      unitOfMeasure: 'PACK',
      price: 6.99,
      reorderThreshold: 20,
    });
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
              price: 2.50,
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

  it('activateProduct updates signal list entry to active', () => {
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
              price: 2.50,
              reorderThreshold: 5,
              active: false,
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
    service.activateProduct(7).subscribe();

    expect(service.products()[0]?.active).toBe(true);
  });
});
