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

  it('maps 422 inactive category to category control', () => {
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
      createProduct: vi.fn(() => throwError(() => ({ status: 422, message: 'Inactive category' }))),
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

    const routeMock = { snapshot: { paramMap: convertToParamMap({}) } } as ActivatedRoute;
    const routerMock = { navigate: vi.fn() } as unknown as Router;
    const component = new ProductFormComponent(
      new FormBuilder(),
      routeMock,
      routerMock,
      productServiceMock as never,
      categoryServiceMock as never
    );

    component.ngOnInit();
    component.form.patchValue({
      sku: 'ABC-1',
      name: 'Product',
      categoryId: 1,
      unitOfMeasure: 'PCS',
      reorderThreshold: 0,
    });

    component.submit();

    expect(component.form.controls.categoryId.hasError('inactiveCategory')).toBe(true);
  });

  it('should reset form successfully', () => {
    const component = createComponent();
    component.ngOnInit();
    component.form.patchValue({
      sku: 'TEST-SKU',
      name: 'Test Product',
      categoryId: 1,
      unitOfMeasure: 'PCS',
      reorderThreshold: 10,
    });
    component.resetForm();
    expect(component.form.value.sku).toBe('');
    expect(component.form.value.name).toBe('');
    expect(component.form.value.categoryId).toBe(null);
  });

  it('should check if in edit mode', () => {
    const componentEdit = createComponent('10');
    componentEdit.ngOnInit();
    expect(componentEdit.isEditMode()).toBe(true);

    const componentCreate = createComponent();
    componentCreate.ngOnInit();
    expect(componentCreate.isEditMode()).toBe(false);
  });

  it('should load product in edit mode', () => {
    const component = createComponent('10');
    component.ngOnInit();
    expect(component.form.getRawValue().sku).toBe('BAT-AA-4P');
    expect(component.form.value.name).toBe('AA Battery 4-Pack');
  });

  it('should normalize SKU to uppercase', () => {
    const component = createComponent();
    component.ngOnInit();
    component.form.patchValue({ sku: 'test-sku' });
    component.normalizeSku();
    expect(component.form.get('sku')?.value).toBe('TEST-SKU');
  });

  it('should display description character count', () => {
    const component = createComponent();
    component.ngOnInit();
    component.form.patchValue({ description: 'Test description' });
    expect(component.descriptionLength()).toBe(16);
  });

  it('should navigate back to products list', () => {
    const component = createComponent();
    component.ngOnInit();
    component.goBack();
    expect(component.router.navigate).toHaveBeenCalledWith(['/products']);
  });

  it('should validate SKU pattern (uppercase and hyphens only)', () => {
    const component = createComponent();
    component.ngOnInit();
    component.form.patchValue({ sku: 'test-123' });
    expect(component.form.controls.sku.hasError('pattern')).toBe(true);
    component.form.patchValue({ sku: 'TEST-123' });
    expect(component.form.controls.sku.hasError('pattern')).toBe(false);
  });

  it('should validate SKU max length', () => {
    const component = createComponent();
    component.ngOnInit();
    const longSku = 'A'.repeat(51);
    component.form.patchValue({ sku: longSku });
    expect(component.form.controls.sku.hasError('maxlength')).toBe(true);
  });

  it('should validate name max length', () => {
    const component = createComponent();
    component.ngOnInit();
    const longName = 'A'.repeat(201);
    component.form.patchValue({ name: longName });
    expect(component.form.controls.name.hasError('maxlength')).toBe(true);
  });

  it('should validate category is required', () => {
    const component = createComponent();
    component.ngOnInit();
    component.form.patchValue({ categoryId: null });
    component.form.markAllAsTouched();
    expect(component.form.controls.categoryId.hasError('required')).toBe(true);
  });

  it('should set duplicate error on form submission conflict', () => {
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
