import '@angular/compiler';
import { FormBuilder } from '@angular/forms';
import { ActivatedRoute, convertToParamMap, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';
import { ProductFormComponent } from './product-form.component';

function createComponent(routeId?: string, createThrowsConflict = false): {
  component: ProductFormComponent;
  productServiceMock: {
    loadProduct: ReturnType<typeof vi.fn>;
    createProduct: ReturnType<typeof vi.fn>;
    updateProduct: ReturnType<typeof vi.fn>;
  };
  categoryServiceMock: {
    activeCategories: () => Array<{ id: number; name: string; description: null; active: boolean; productCount: number; createdAt: string; updatedAt: string }>;
    loadCategories: ReturnType<typeof vi.fn>;
  };
  routerMock: { navigate: ReturnType<typeof vi.fn> };
} {
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
  };

  return {
    component: new ProductFormComponent(
      new FormBuilder(),
      routeMock,
      routerMock as unknown as Router,
      productServiceMock as never,
      categoryServiceMock as never
    ),
    productServiceMock,
    categoryServiceMock,
    routerMock,
  };
}

describe('ProductFormComponent', () => {
  it('loads active categories on init', () => {
    const { component, categoryServiceMock } = createComponent();

    component.ngOnInit();

    expect(categoryServiceMock.loadCategories).toHaveBeenCalledWith({
      active: true,
      sortBy: 'name',
      sortDir: 'asc',
      page: 1,
      size: 200,
    });
    expect(component.categories()).toHaveLength(1);
  });

  it('disables SKU in edit mode', () => {
    const { component } = createComponent('10');
    component.ngOnInit();
    expect(component.form.controls.sku.disabled).toBe(true);
  });

  it('validates reorder threshold min 0', () => {
    const { component } = createComponent();
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
    const { component } = createComponent(undefined, true);
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

  it('marks invalid create form touched and does not submit', () => {
    const { component, productServiceMock } = createComponent();

    component.ngOnInit();
    component.submit();

    expect(component.form.controls.sku.touched).toBe(true);
    expect(productServiceMock.createProduct).not.toHaveBeenCalled();
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
    const { component } = createComponent();
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
    const { component: componentEdit } = createComponent('10');
    componentEdit.ngOnInit();
    expect(componentEdit.isEditMode()).toBe(true);

    const { component: componentCreate } = createComponent();
    componentCreate.ngOnInit();
    expect(componentCreate.isEditMode()).toBe(false);
  });

  it('should load product in edit mode', () => {
    const { component } = createComponent('10');
    component.ngOnInit();
    expect(component.form.getRawValue().sku).toBe('BAT-AA-4P');
    expect(component.form.value.name).toBe('AA Battery 4-Pack');
  });

  it('shows error message when product load fails in edit mode', () => {
    const { component, productServiceMock } = createComponent('10');
    productServiceMock.loadProduct.mockReturnValueOnce(throwError(() => new Error('boom')));

    component.ngOnInit();

    expect(component.errorMessage()).toBe('Failed to load product for editing.');
  });

  it('should normalize SKU to uppercase', () => {
    const { component } = createComponent();
    component.ngOnInit();
    component.form.patchValue({ sku: 'test-sku' });
    component.normalizeSku();
    expect(component.form.get('sku')?.value).toBe('TEST-SKU');
  });

  it('does not rewrite SKU when already normalized', () => {
    const { component } = createComponent();

    component.ngOnInit();
    component.form.patchValue({ sku: 'TEST-SKU' });
    component.normalizeSku();

    expect(component.form.get('sku')?.value).toBe('TEST-SKU');
  });

  it('should display description character count', () => {
    const { component } = createComponent();
    component.ngOnInit();
    component.form.patchValue({ description: 'Test description' });
    expect(component.descriptionLength()).toBe(16);
  });

  it('should navigate back to products list', () => {
    const { component } = createComponent();
    component.ngOnInit();
    component.goBack();
    expect(component.router.navigate).toHaveBeenCalledWith(['/products']);
  });

  it('should validate SKU pattern (uppercase and hyphens only)', () => {
    const { component } = createComponent();
    component.ngOnInit();
    component.form.patchValue({ sku: 'test-123' });
    expect(component.form.controls.sku.hasError('pattern')).toBe(true);
    component.form.patchValue({ sku: 'TEST-123' });
    expect(component.form.controls.sku.hasError('pattern')).toBe(false);
  });

  it('should validate SKU max length', () => {
    const { component } = createComponent();
    component.ngOnInit();
    const longSku = 'A'.repeat(51);
    component.form.patchValue({ sku: longSku });
    expect(component.form.controls.sku.hasError('maxlength')).toBe(true);
  });

  it('should validate name max length', () => {
    const { component } = createComponent();
    component.ngOnInit();
    const longName = 'A'.repeat(201);
    component.form.patchValue({ name: longName });
    expect(component.form.controls.name.hasError('maxlength')).toBe(true);
  });

  it('should validate category is required', () => {
    const { component } = createComponent();
    component.ngOnInit();
    component.form.patchValue({ categoryId: null });
    component.form.markAllAsTouched();
    expect(component.form.controls.categoryId.hasError('required')).toBe(true);
  });

  it('showError returns true only for touched controls with matching error', () => {
    const { component } = createComponent();

    component.ngOnInit();
    component.form.controls.name.markAsTouched();
    component.form.controls.name.setValue('');

    expect(component.showError('name', 'required')).toBe(true);
    expect(component.showError('unitOfMeasure', 'required')).toBe(false);
  });

  it('submits create payload with trimmed optional values and navigates to detail', () => {
    const { component, productServiceMock, routerMock } = createComponent();

    component.ngOnInit();
    component.form.patchValue({
      sku: 'ABC-1',
      name: 'Product',
      description: 'Notes',
      categoryId: 1,
      unitOfMeasure: 'PCS',
      reorderThreshold: 7,
    });

    component.submit();

    expect(component.isSubmitting()).toBe(true);
    expect(productServiceMock.createProduct).toHaveBeenCalledWith({
      sku: 'ABC-1',
      name: 'Product',
      description: 'Notes',
      categoryId: 1,
      unitOfMeasure: 'PCS',
      reorderThreshold: 7,
    });
    expect(routerMock.navigate).toHaveBeenCalledWith(['/products', 10]);
  });

  it('omits blank description from create payload', () => {
    const { component, productServiceMock } = createComponent();

    component.ngOnInit();
    component.form.patchValue({
      sku: 'ABC-1',
      name: 'Product',
      description: '   ',
      categoryId: 1,
      unitOfMeasure: 'PCS',
      reorderThreshold: 0,
    });

    component.submit();

    expect(productServiceMock.createProduct).toHaveBeenCalledWith({
      sku: 'ABC-1',
      name: 'Product',
      description: undefined,
      categoryId: 1,
      unitOfMeasure: 'PCS',
      reorderThreshold: 0,
    });
  });

  it('submits update payload without SKU and navigates to detail', () => {
    const { component, productServiceMock, routerMock } = createComponent('10');

    component.ngOnInit();
    component.form.patchValue({
      name: ' Updated Product ',
      description: ' Updated notes ',
      categoryId: 1,
      unitOfMeasure: ' BOX ',
      reorderThreshold: 3,
    });

    component.submit();

    expect(productServiceMock.updateProduct).toHaveBeenCalledWith(10, {
      name: 'Updated Product',
      description: 'Updated notes',
      categoryId: 1,
      unitOfMeasure: 'BOX',
      reorderThreshold: 3,
    });
    expect(routerMock.navigate).toHaveBeenCalledWith(['/products', 10]);
  });

  it('handles missing product id during update', () => {
    const { component, productServiceMock } = createComponent();

    component.ngOnInit();
    component.isEditMode.set(true);
    component.form.patchValue({
      sku: 'TEST-SKU',
      name: 'Product',
      categoryId: 1,
      unitOfMeasure: 'PCS',
      reorderThreshold: 0,
    });

    component.submit();

    expect(productServiceMock.updateProduct).not.toHaveBeenCalled();
    expect(component.isSubmitting()).toBe(false);
    expect(component.errorMessage()).toBe('Invalid product id.');
  });

  it('maps fieldErrors to matching controls', () => {
    const { component, productServiceMock } = createComponent();
    productServiceMock.createProduct.mockReturnValueOnce(
      throwError(() => ({
        fieldErrors: [
          { field: 'name', message: 'Name must be unique' },
          { field: 'missingField', message: 'Ignore me' },
        ],
      }))
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

    expect(component.isSubmitting()).toBe(false);
    expect(component.form.controls.name.errors).toEqual({ server: 'Name must be unique' });
    expect(component.form.controls.name.touched).toBe(true);
  });

  it('uses fallback error message for unknown API errors', () => {
    const { component, productServiceMock } = createComponent();
    productServiceMock.createProduct.mockReturnValueOnce(throwError(() => ({ status: 500 })));

    component.ngOnInit();
    component.form.patchValue({
      sku: 'ABC-1',
      name: 'Product',
      categoryId: 1,
      unitOfMeasure: 'PCS',
      reorderThreshold: 0,
    });

    component.submit();

    expect(component.errorMessage()).toBe('Unable to save product.');
  });

  it('should set duplicate error on form submission conflict', () => {
    const { component } = createComponent(undefined, true);
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
