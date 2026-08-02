import '@angular/compiler';
import { Injector, runInInjectionContext, signal } from '@angular/core';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { CategoryService } from '../../../categories/services/category.service';
import { ProductService } from '../../services/product.service';
import { ProductListComponent } from './product-list.component';

describe('ProductListComponent', () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  function createComponent(options?: { loadProductsShouldFail?: boolean; totalPages?: number }) {
    const loadProductsImpl = options?.loadProductsShouldFail
      ? vi.fn(() => throwError(() => new Error('load failed')))
      : vi.fn(() => of({ data: [], pagination: { page: 1, size: 20, totalElements: 0, totalPages: 0 } }));

    const productServiceMock = {
      products: signal([
        {
          id: 1,
          sku: 'BAT-AA-4P',
          name: 'AA Battery 4-Pack',
          description: null,
          category: { id: 1, name: 'Electronics' },
          unitOfMeasure: 'PACK',
          price: 4.99,
          reorderThreshold: 50,
          active: true,
          createdAt: '2026-08-01T00:00:00Z',
          updatedAt: '2026-08-01T00:00:00Z',
        },
      ]),
      isLoading: signal(false),
      totalElements: signal(1),
      totalPages: signal(options?.totalPages ?? 1),
      loadProducts: loadProductsImpl,
      deactivateProduct: vi.fn(() => of(void 0)),
      activateProduct: vi.fn(() => of(void 0)),
    };

    const categoryServiceMock = {
      categories: signal([{ id: 1, name: 'Electronics' }]),
      loadCategories: vi.fn(() => of({ data: [], pagination: { page: 1, size: 20, totalElements: 0, totalPages: 0 } })),
    };

    const routerMock = { navigate: vi.fn() };

    if (!(globalThis as { window?: { confirm?: (message?: string) => boolean } }).window) {
      vi.stubGlobal('window', {
        confirm: () => true,
      });
    }

    const injector = Injector.create({
      providers: [
        { provide: ProductService, useValue: productServiceMock },
        { provide: CategoryService, useValue: categoryServiceMock },
        { provide: Router, useValue: routerMock },
      ],
    });

    const component = runInInjectionContext(injector, () => new ProductListComponent());
    return { component, routerMock, productServiceMock, categoryServiceMock };
  }

  it('ngOnInit — loads categories and products with default query', () => {
    const { component, productServiceMock, categoryServiceMock } = createComponent();

    component.ngOnInit();

    expect(categoryServiceMock.loadCategories).toHaveBeenCalledWith({
      active: true,
      sortBy: 'name',
      sortDir: 'asc',
      page: 1,
      size: 200,
    });
    expect(productServiceMock.loadProducts).toHaveBeenCalledWith({
      search: undefined,
      categoryId: undefined,
      active: undefined,
      sortBy: 'name',
      sortDir: 'asc',
      page: 1,
      size: 20,
    });
  });

  it('onSearchInput — updates search, debounces reload and resets page', () => {
    vi.useFakeTimers();
    const { component, productServiceMock } = createComponent();

    component.ngOnInit();
    component.currentPage.set(3);
    productServiceMock.loadProducts.mockClear();

    component.onSearchInput({ target: { value: '  battery  ' } } as unknown as Event);

    expect(component.search()).toBe('  battery  ');
    expect(productServiceMock.loadProducts).not.toHaveBeenCalled();

    vi.advanceTimersByTime(300);

    expect(component.currentPage()).toBe(1);
    expect(productServiceMock.loadProducts).toHaveBeenCalledWith({
      search: 'battery',
      categoryId: undefined,
      active: undefined,
      sortBy: 'name',
      sortDir: 'asc',
      page: 1,
      size: 20,
    });
  });

  it('onCategoryChange — sets category, resets page and reloads with numeric categoryId', () => {
    const { component, productServiceMock } = createComponent();

    component.currentPage.set(4);
    component.onCategoryChange({ target: { value: '2' } } as unknown as Event);

    expect(component.selectedCategoryId()).toBe('2');
    expect(component.currentPage()).toBe(1);
    expect(productServiceMock.loadProducts).toHaveBeenCalledWith(
      expect.objectContaining({ categoryId: 2, page: 1 })
    );
  });

  it('onActiveFilterChange — maps ACTIVE/INACTIVE to boolean query', () => {
    const { component, productServiceMock } = createComponent();

    component.onActiveFilterChange({ target: { value: 'ACTIVE' } } as unknown as Event);
    expect(component.activeFilter()).toBe('ACTIVE');
    expect(productServiceMock.loadProducts).toHaveBeenLastCalledWith(
      expect.objectContaining({ active: true })
    );

    component.onActiveFilterChange({ target: { value: 'INACTIVE' } } as unknown as Event);
    expect(component.activeFilter()).toBe('INACTIVE');
    expect(productServiceMock.loadProducts).toHaveBeenLastCalledWith(
      expect.objectContaining({ active: false })
    );
  });

  it('onSort — same field toggles direction, new field resets to asc', () => {
    const { component, productServiceMock } = createComponent();

    component.onSort('name');
    expect(component.sortBy()).toBe('name');
    expect(component.sortDir()).toBe('desc');
    expect(productServiceMock.loadProducts).toHaveBeenLastCalledWith(
      expect.objectContaining({ sortBy: 'name', sortDir: 'desc' })
    );

    component.onSort('sku');
    expect(component.sortBy()).toBe('sku');
    expect(component.sortDir()).toBe('asc');
    expect(productServiceMock.loadProducts).toHaveBeenLastCalledWith(
      expect.objectContaining({ sortBy: 'sku', sortDir: 'asc' })
    );
  });

  it('sortMarker — returns empty, up or down marker based on current sort', () => {
    const { component } = createComponent();

    expect(component.sortMarker('sku')).toBe('');
    expect(component.sortMarker('name')).toBe('↑');

    component.onSort('name');
    expect(component.sortMarker('name')).toBe('↓');
  });

  it('goPrevious and goNext — respect pagination boundaries and update page', () => {
    const { component, productServiceMock } = createComponent({ totalPages: 3 });

    component.currentPage.set(1);
    component.goPrevious();
    expect(component.currentPage()).toBe(1);

    component.goNext();
    expect(component.currentPage()).toBe(2);

    component.goPrevious();
    expect(component.currentPage()).toBe(1);

    component.currentPage.set(3);
    component.goNext();
    expect(component.currentPage()).toBe(3);

    expect(productServiceMock.loadProducts).toHaveBeenCalledTimes(2);
  });

  it('goToCreate, goToDetail and goToEdit — routes to expected pages', () => {
    const { component, routerMock } = createComponent();

    component.goToCreate();
    component.goToDetail(7);
    component.goToEdit(7);

    expect(routerMock.navigate).toHaveBeenNthCalledWith(1, ['/products/new']);
    expect(routerMock.navigate).toHaveBeenNthCalledWith(2, ['/products', 7]);
    expect(routerMock.navigate).toHaveBeenNthCalledWith(3, ['/products', 7, 'edit']);
  });

  it('deactivate — cancelled confirm does not call service', () => {
    const { component, productServiceMock } = createComponent();
    vi.spyOn(window, 'confirm').mockReturnValue(false);

    component.deactivate({
      id: 5,
      sku: 'SKU-5',
      name: 'Product 5',
      description: null,
      category: { id: 1, name: 'Electronics' },
      unitOfMeasure: 'PCS',
      price: 1.25,
      reorderThreshold: 1,
      active: true,
      createdAt: '2026-08-01T00:00:00Z',
      updatedAt: '2026-08-01T00:00:00Z',
    });

    expect(productServiceMock.deactivateProduct).not.toHaveBeenCalled();
  });

  it('deactivate — confirm true calls service and handles success and error', () => {
    const { component, productServiceMock } = createComponent();
    vi.spyOn(window, 'confirm').mockReturnValue(true);

    component.errorMessage.set('Previous error');
    component.deactivate({
      id: 6,
      sku: 'SKU-6',
      name: 'Product 6',
      description: null,
      category: { id: 1, name: 'Electronics' },
      unitOfMeasure: 'PCS',
      price: 1.25,
      reorderThreshold: 1,
      active: true,
      createdAt: '2026-08-01T00:00:00Z',
      updatedAt: '2026-08-01T00:00:00Z',
    });

    expect(productServiceMock.deactivateProduct).toHaveBeenCalledWith(6);
    expect(component.errorMessage()).toBe('');

    productServiceMock.deactivateProduct.mockReturnValueOnce(throwError(() => new Error('boom')));
    component.deactivate({
      id: 7,
      sku: 'SKU-7',
      name: 'Product 7',
      description: null,
      category: { id: 1, name: 'Electronics' },
      unitOfMeasure: 'PCS',
      price: 1.25,
      reorderThreshold: 1,
      active: true,
      createdAt: '2026-08-01T00:00:00Z',
      updatedAt: '2026-08-01T00:00:00Z',
    });

    expect(component.errorMessage()).toBe('Failed to deactivate product.');
  });

  it('activate — handles success and error', () => {
    const { component, productServiceMock } = createComponent();

    component.errorMessage.set('Previous error');
    component.activate(8);
    expect(productServiceMock.activateProduct).toHaveBeenCalledWith(8);
    expect(component.errorMessage()).toBe('');

    productServiceMock.activateProduct.mockReturnValueOnce(throwError(() => new Error('boom')));
    component.activate(9);
    expect(component.errorMessage()).toBe('Failed to activate product.');
  });

  it('formatDate — formats date using en-US short style', () => {
    const { component } = createComponent();
    const input = '2026-08-01T12:00:00Z';

    expect(component.formatDate(input)).toBe(
      new Date(input).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    );
  });

  it('loadProducts path — sets load error message when service fails', () => {
    const { component } = createComponent({ loadProductsShouldFail: true });

    component.onCategoryChange({ target: { value: '3' } } as unknown as Event);

    expect(component.errorMessage()).toBe('Failed to load products.');
  });
});
