import '@angular/compiler';
import { Injector, signal, runInInjectionContext } from '@angular/core';
import { ActivatedRoute, Router, convertToParamMap } from '@angular/router';
import { of, throwError } from 'rxjs';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ProductDetailResponse } from '../../models/product.model';
import { ProductService } from '../../services/product.service';
import { ProductDetailComponent } from './product-detail.component';

function makeProductDetail(): ProductDetailResponse {
  return {
    id: 5,
    sku: 'SKU-5',
    name: 'Product 5',
    description: 'Test product',
    category: { id: 1, name: 'Electronics' },
    unitOfMeasure: 'PCS',
    price: 9.99,
    reorderThreshold: 3,
    active: true,
    inventory: [
      {
        locationId: 10,
        locationName: 'Main Warehouse',
        locationType: 'WAREHOUSE',
        quantityOnHand: 12,
        stockStatus: 'IN_STOCK',
      },
    ],
    createdAt: '2026-08-01T10:00:00Z',
    updatedAt: '2026-08-01T11:00:00Z',
  };
}

function createComponent(options?: {
  routeId?: string;
  loadShouldFail?: boolean;
  deactivateShouldFail?: boolean;
  selectedProduct?: ProductDetailResponse | null;
}) {
  const loadProduct = options?.loadShouldFail
    ? vi.fn(() => throwError(() => new Error('load failed')))
    : vi.fn(() => of({ data: makeProductDetail() }));

  const deactivateProduct = options?.deactivateShouldFail
    ? vi.fn(() => throwError(() => new Error('deactivate failed')))
    : vi.fn(() => of(void 0));

  const productServiceMock = {
    selectedProduct: signal<ProductDetailResponse | null>(options?.selectedProduct ?? null),
    isLoading: signal(false),
    loadProduct,
    deactivateProduct,
  };

  const routeMock: ActivatedRoute = {
    snapshot: {
      paramMap: convertToParamMap(options?.routeId ? { id: options.routeId } : {}),
    },
  } as ActivatedRoute;

  const routerMock = {
    navigate: vi.fn(),
  };

  const injector = Injector.create({
    providers: [
      { provide: ActivatedRoute, useValue: routeMock },
      { provide: Router, useValue: routerMock },
      { provide: ProductService, useValue: productServiceMock },
    ],
  });

  const component = runInInjectionContext(injector, () => new ProductDetailComponent());

  return { component, productServiceMock, routerMock };
}

describe('ProductDetailComponent', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  function mockConfirm(value: boolean) {
    if (!globalThis.window) {
      vi.stubGlobal('window', {
        confirm: vi.fn(() => value),
      });
      return;
    }

    vi.spyOn(globalThis.window, 'confirm').mockReturnValue(value);
  }

  it('ngOnInit without id sets validation error and does not load product', () => {
    const { component, productServiceMock } = createComponent();

    component.ngOnInit();

    expect(component.errorMessage()).toBe('Invalid product id.');
    expect(productServiceMock.loadProduct).not.toHaveBeenCalled();
  });

  it('ngOnInit with id loads product by numeric id', () => {
    const { component, productServiceMock } = createComponent({ routeId: '5' });

    component.ngOnInit();

    expect(productServiceMock.loadProduct).toHaveBeenCalledWith(5);
  });

  it('ngOnInit sets load error message when request fails', () => {
    const { component } = createComponent({ routeId: '5', loadShouldFail: true });

    component.ngOnInit();

    expect(component.errorMessage()).toBe('Failed to load product details.');
  });

  it('product computed returns selected product signal value', () => {
    const detail = makeProductDetail();
    const { component, productServiceMock } = createComponent({ selectedProduct: null });

    expect(component.product()).toBeNull();

    productServiceMock.selectedProduct.set(detail);

    expect(component.product()).toEqual(detail);
  });

  it('goBack navigates to products list', () => {
    const { component, routerMock } = createComponent();

    component.goBack();

    expect(routerMock.navigate).toHaveBeenCalledWith(['/products']);
  });

  it('goToEdit does nothing when product id is missing', () => {
    const { component, routerMock } = createComponent();

    component.goToEdit();

    expect(routerMock.navigate).not.toHaveBeenCalled();
  });

  it('goToEdit navigates to edit route when product id exists', () => {
    const { component, routerMock } = createComponent({ routeId: '5' });
    component.ngOnInit();

    component.goToEdit();

    expect(routerMock.navigate).toHaveBeenCalledWith(['/products', 5, 'edit']);
  });

  it('deactivate does nothing when product id or product is missing', () => {
    const { component, productServiceMock } = createComponent();
    mockConfirm(true);

    component.deactivate();

    expect(globalThis.window.confirm).not.toHaveBeenCalled();
    expect(productServiceMock.deactivateProduct).not.toHaveBeenCalled();
  });

  it('deactivate cancelled by user does not call service', () => {
    const { component, productServiceMock } = createComponent({ routeId: '5', selectedProduct: makeProductDetail() });
    component.ngOnInit();
    mockConfirm(false);

    component.deactivate();

    expect(productServiceMock.deactivateProduct).not.toHaveBeenCalled();
  });

  it('deactivate confirmed calls service and navigates to list', () => {
    const { component, productServiceMock, routerMock } = createComponent({ routeId: '5', selectedProduct: makeProductDetail() });
    component.ngOnInit();
    mockConfirm(true);

    component.deactivate();

    expect(productServiceMock.deactivateProduct).toHaveBeenCalledWith(5);
    expect(routerMock.navigate).toHaveBeenCalledWith(['/products']);
  });

  it('deactivate failure sets error message', () => {
    const { component } = createComponent({ routeId: '5', selectedProduct: makeProductDetail(), deactivateShouldFail: true });
    component.ngOnInit();
    mockConfirm(true);

    component.deactivate();

    expect(component.errorMessage()).toBe('Failed to deactivate product.');
  });

  it('formatDate formats with en-US date and time style', () => {
    const { component } = createComponent();
    const input = '2026-08-01T12:30:00Z';

    expect(component.formatDate(input)).toBe(
      new Date(input).toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    );
  });
});
