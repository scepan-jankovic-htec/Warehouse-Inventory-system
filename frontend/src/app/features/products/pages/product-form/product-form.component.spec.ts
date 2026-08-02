import '@angular/compiler';
import { FormBuilder } from '@angular/forms';
import { ActivatedRoute, convertToParamMap, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';
import { ProductFormComponent } from './product-form.component';

function createComponent(routeId?: string, createThrowsConflict = false): ProductFormComponent {
  const productServiceMock = {
    loadProduct: vi.fn(() =>
      of({
        data: {
          id: 10,
          sku: 'BAT-AA-4P',
          name: 'AA Battery 4-Pack',
          description: null,
          category: { id: 1, name: 'Electronics' },
          unitOfMeasure: 'PACK',
          reorderThreshold: 50,
          active: true,
          inventory: [],
          createdAt: '2026-08-01T10:00:00Z',
          updatedAt: '2026-08-01T10:00:00Z',
        },
      })
    ),
    createProduct: createThrowsConflict
      ? vi.fn(() => throwError(() => ({ status: 409, message: 'Duplicate SKU' })))
      : vi.fn(() => of({ data: { id: 10 } })),
    updateProduct: vi.fn(() => of({ data: { id: 10 } })),
  };

  const categoryServiceMock = {
    activeCategories: () => [
      { id: 1, name: 'Electronics', description: null, active: true, productCount: 1, createdAt: '', updatedAt: '' },
    ],
    loadCategories: vi.fn(() =>
      of({
        data: [
          { id: 1, name: 'Electronics', description: null, active: true, productCount: 1, createdAt: '', updatedAt: '' },
        ],
        pagination: { page: 1, size: 20, totalElements: 1, totalPages: 1 },
      })
    ),
  };

  const routeMock = {
    snapshot: {
      paramMap: convertToParamMap(routeId ? { id: routeId } : {}),
    },
  } as ActivatedRoute;

  const routerMock = {
    navigate: vi.fn(),
  } as unknown as Router;

  return new ProductFormComponent(
    new FormBuilder(),
    routeMock,
    routerMock,
    productServiceMock as never,
    categoryServiceMock as never
  );
}

describe('ProductFormComponent', () => {
  it('disables SKU in edit mode', () => {
    const component = createComponent('10');
    component.ngOnInit();
    expect(component.form.controls.sku.disabled).toBe(true);
  });

  it('validates reorder threshold min 0', () => {
    const component = createComponent();
    component.ngOnInit();
    component.form.patchValue({
      sku: 'ABC-1',
      name: 'Product',
      categoryId: 1,
      unitOfMeasure: 'PCS',
      reorderThreshold: -1,
    });

    expect(component.form.controls.reorderThreshold.hasError('min')).toBe(true);
  });

  it('maps 409 conflict to sku duplicate error', () => {
    const component = createComponent(undefined, true);
    component.ngOnInit();
    component.form.patchValue({
      sku: 'ABC-1',
      name: 'Product',
      categoryId: 1,
      unitOfMeasure: 'PCS',
      reorderThreshold: 0,
    });

    component.submit();
    expect(component.form.controls.sku.hasError('duplicate')).toBe(true);
  });
});
