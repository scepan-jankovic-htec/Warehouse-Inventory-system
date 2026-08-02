import '@angular/compiler';
import { FormBuilder } from '@angular/forms';
import { Router } from '@angular/router';
import { of, throwError, Subject, delay } from 'rxjs';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { ReceiveFormComponent } from './receive-form.component';
import { InventoryService } from '../../services/inventory.service';
import { ProductResponse } from '../../../products/models/product.model';
import { LocationResponse } from '../../../locations/models/location.model';

async function setup(
  productOptionsResult = of({
    data: [
      {
        id: 1,
        sku: 'SKU001',
        name: 'Product 1',
        description: null,
        category: { id: 1, name: 'Category 1' },
        unitOfMeasure: 'UNIT',
        reorderThreshold: 10,
        active: true,
        createdAt: '2024-01-01',
        updatedAt: '2024-01-02'
      } as ProductResponse
    ]
  }).pipe(delay(0)),
  locationOptionsResult = of({
    data: [
      {
        id: 1,
        name: 'Location 1',
        type: 'WAREHOUSE' as const,
        address: null,
        active: true,
        createdAt: '2024-01-01',
        updatedAt: '2024-01-02'
      } as LocationResponse
    ]
  }).pipe(delay(0))
) {
  const inventoryServiceMock = {
    getProductOptions: vi.fn(() => productOptionsResult),
    getLocationOptions: vi.fn(() => locationOptionsResult),
    getInventoryByProductAndLocation: vi.fn(),
    receive: vi.fn()
  };

  const routerMock = {
    navigate: vi.fn()
  };

  const component = new ReceiveFormComponent(
    new FormBuilder(),
    routerMock as unknown as Router,
    inventoryServiceMock as unknown as InventoryService
  );
  component.ngOnInit();

  const fixture = {
    componentInstance: component,
    detectChanges: () => undefined
  };

  return {
    fixture,
    inventoryServiceMock,
    routerMock
  };
}

describe('ReceiveFormComponent', () => {
  beforeEach(() => {
    // Keep hook for per-test setup symmetry.
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ── Component Initialization ──────────────────────────────────────────────

  it('creates the component', async () => {
    const { fixture } = await setup();
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('initializes signals with default values', async () => {
    const { fixture } = await setup();
    const comp = fixture.componentInstance;
    expect(comp.products()).toEqual([]);
    expect(comp.locations()).toEqual([]);
    expect(comp.currentQuantity()).toBe(0);
    expect(comp.isSubmitting()).toBe(false);
    expect(comp.errorMessage()).toBe('');
  });

  it('initializes form with default values', async () => {
    const { fixture } = await setup();
    const comp = fixture.componentInstance;
    expect(comp.form.get('productId')?.value).toBeNull();
    expect(comp.form.get('locationId')?.value).toBeNull();
    expect(comp.form.get('quantity')?.value).toBe(1);
    expect(comp.form.get('referenceId')?.value).toBe('');
    expect(comp.form.get('reason')?.value).toBe('');
  });

  // ── Data Loading ──────────────────────────────────────────────────────────

  it('loads products on init', async () => {
    const { fixture, inventoryServiceMock } = await setup();
    expect(inventoryServiceMock.getProductOptions).toHaveBeenCalled();
  });

  it('loads locations on init', async () => {
    const { fixture, inventoryServiceMock } = await setup();
    expect(inventoryServiceMock.getLocationOptions).toHaveBeenCalled();
  });

  it('sets products signal with loaded data', async () => {
    const { fixture } = await setup();
    const comp = fixture.componentInstance;
    await new Promise(resolve => setTimeout(resolve, 50));
    fixture.detectChanges();
    expect(comp.products().length).toBe(1);
    expect(comp.products()[0].sku).toBe('SKU001');
  });

  it('sets locations signal with loaded data', async () => {
    const { fixture } = await setup();
    const comp = fixture.componentInstance;
    await new Promise(resolve => setTimeout(resolve, 50));
    fixture.detectChanges();
    expect(comp.locations().length).toBe(1);
    expect(comp.locations()[0].name).toBe('Location 1');
  });

  it('handles product loading error', async () => {
    const { fixture } = await setup(
      throwError(() => ({ status: 500 })),
      of({ data: [] })
    );
    const comp = fixture.componentInstance;
    await new Promise(resolve => setTimeout(resolve, 50));
    expect(comp.errorMessage()).toBe('Failed to load products.');
  });

  it('handles location loading error', async () => {
    const { fixture } = await setup(
      of({ data: [] }),
      throwError(() => ({ status: 500 }))
    );
    const comp = fixture.componentInstance;
    await new Promise(resolve => setTimeout(resolve, 50));
    expect(comp.errorMessage()).toBe('Failed to load locations.');
  });

  it('loads multiple products', async () => {
    const multiProductResult = of({
      data: [
        {
          id: 1,
          sku: 'SKU001',
          name: 'Product 1',
          description: null,
          category: { id: 1, name: 'Category 1' },
          unitOfMeasure: 'UNIT',
          reorderThreshold: 10,
          active: true,
          createdAt: '2024-01-01',
          updatedAt: '2024-01-02'
        } as ProductResponse,
        {
          id: 2,
          sku: 'SKU002',
          name: 'Product 2',
          description: 'Description',
          category: { id: 1, name: 'Category 1' },
          unitOfMeasure: 'KG',
          reorderThreshold: 20,
          active: true,
          createdAt: '2024-01-01',
          updatedAt: '2024-01-02'
        } as ProductResponse
      ]
    });
    const { fixture } = await setup(multiProductResult);
    const comp = fixture.componentInstance;
    await new Promise(resolve => setTimeout(resolve, 50));
    fixture.detectChanges();
    expect(comp.products().length).toBe(2);
  });

  // ── Form Validation ───────────────────────────────────────────────────────

  it('form is invalid when productId is missing', async () => {
    const { fixture } = await setup();
    const comp = fixture.componentInstance;
    comp.form.patchValue({
      locationId: 1,
      quantity: 5,
      productId: null
    });
    expect(comp.form.invalid).toBe(true);
  });

  it('form is invalid when locationId is missing', async () => {
    const { fixture } = await setup();
    const comp = fixture.componentInstance;
    comp.form.patchValue({
      productId: 1,
      quantity: 5,
      locationId: null
    });
    expect(comp.form.invalid).toBe(true);
  });

  it('form is invalid when quantity is less than 1', async () => {
    const { fixture } = await setup();
    const comp = fixture.componentInstance;
    comp.form.patchValue({
      productId: 1,
      locationId: 1,
      quantity: 0
    });
    expect(comp.form.invalid).toBe(true);
  });

  it('form is invalid when quantity is missing', async () => {
    const { fixture } = await setup();
    const comp = fixture.componentInstance;
    comp.form.patchValue({
      productId: 1,
      locationId: 1,
      quantity: null
    });
    expect(comp.form.invalid).toBe(true);
  });

  it('form is invalid when referenceId exceeds max length', async () => {
    const { fixture } = await setup();
    const comp = fixture.componentInstance;
    comp.form.patchValue({
      productId: 1,
      locationId: 1,
      quantity: 5,
      referenceId: 'a'.repeat(101)
    });
    expect(comp.form.invalid).toBe(true);
  });

  it('form is invalid when reason exceeds max length', async () => {
    const { fixture } = await setup();
    const comp = fixture.componentInstance;
    comp.form.patchValue({
      productId: 1,
      locationId: 1,
      quantity: 5,
      reason: 'a'.repeat(501)
    });
    expect(comp.form.invalid).toBe(true);
  });

  it('form is valid with required fields only', async () => {
    const { fixture } = await setup();
    const comp = fixture.componentInstance;
    comp.form.patchValue({
      productId: 1,
      locationId: 1,
      quantity: 5
    });
    expect(comp.form.valid).toBe(true);
  });

  it('form is valid with all fields filled', async () => {
    const { fixture } = await setup();
    const comp = fixture.componentInstance;
    comp.form.patchValue({
      productId: 1,
      locationId: 1,
      quantity: 10,
      referenceId: 'REF123',
      reason: 'Restocking'
    });
    expect(comp.form.valid).toBe(true);
  });

  it('form is valid with optional fields empty', async () => {
    const { fixture } = await setup();
    const comp = fixture.componentInstance;
    comp.form.patchValue({
      productId: 1,
      locationId: 1,
      quantity: 5,
      referenceId: '',
      reason: ''
    });
    expect(comp.form.valid).toBe(true);
  });

  // ── Projected Quantity Computed ───────────────────────────────────────────

  it('projectedQuantity includes current quantity', async () => {
    const { fixture } = await setup();
    const comp = fixture.componentInstance;
    comp.currentQuantity.set(100);
    comp.form.patchValue({ quantity: 50 });
    expect(comp.projectedQuantity()).toBe(150);
  });

  it('projectedQuantity updates when quantity changes', async () => {
    const { fixture } = await setup();
    const comp = fixture.componentInstance;
    comp.currentQuantity.set(100);
    comp.form.patchValue({ quantity: 10 });
    expect(comp.projectedQuantity()).toBe(110);
    comp.form.patchValue({ quantity: 20 });
    expect(comp.projectedQuantity()).toBe(120);
  });

  it('projectedQuantity treats negative quantity as zero', async () => {
    const { fixture } = await setup();
    const comp = fixture.componentInstance;
    comp.currentQuantity.set(100);
    comp.form.patchValue({ quantity: -10 });
    expect(comp.projectedQuantity()).toBe(100);
  });

  it('projectedQuantity treats null quantity as zero', async () => {
    const { fixture } = await setup();
    const comp = fixture.componentInstance;
    comp.currentQuantity.set(50);
    comp.form.patchValue({ quantity: null });
    expect(comp.projectedQuantity()).toBe(50);
  });

  // ── showError Method ──────────────────────────────────────────────────────

  it('showError returns false when control is not touched', async () => {
    const { fixture } = await setup();
    const comp = fixture.componentInstance;
    comp.form.patchValue({ productId: null });
    expect(comp.showError('productId', 'required')).toBe(false);
  });

  it('showError returns false when control has no error', async () => {
    const { fixture } = await setup();
    const comp = fixture.componentInstance;
    comp.form.patchValue({ productId: 1 });
    comp.form.get('productId')?.markAsTouched();
    expect(comp.showError('productId', 'required')).toBe(false);
  });

  it('showError returns true when control is touched and has error', async () => {
    const { fixture } = await setup();
    const comp = fixture.componentInstance;
    comp.form.patchValue({ productId: null });
    comp.form.get('productId')?.markAsTouched();
    expect(comp.showError('productId', 'required')).toBe(true);
  });

  it('showError works for quantity min error', async () => {
    const { fixture } = await setup();
    const comp = fixture.componentInstance;
    comp.form.patchValue({ quantity: 0 });
    comp.form.get('quantity')?.markAsTouched();
    expect(comp.showError('quantity', 'min')).toBe(true);
  });

  it('showError works for referenceId maxlength error', async () => {
    const { fixture } = await setup();
    const comp = fixture.componentInstance;
    comp.form.patchValue({ referenceId: 'a'.repeat(101) });
    comp.form.get('referenceId')?.markAsTouched();
    expect(comp.showError('referenceId', 'maxlength')).toBe(true);
  });

  // ── refreshCurrentQuantity ────────────────────────────────────────────────

  it('refreshCurrentQuantity sets current quantity to loaded value', async () => {
    const { fixture, inventoryServiceMock } = await setup();
    inventoryServiceMock.getInventoryByProductAndLocation.mockReturnValue(
      of({ data: { quantityOnHand: 42 } })
    );
    const comp = fixture.componentInstance;
    comp.form.patchValue({ productId: 1, locationId: 2 });
    comp.refreshCurrentQuantity();
    await new Promise(resolve => setTimeout(resolve, 50));
    expect(comp.currentQuantity()).toBe(42);
  });

  it('refreshCurrentQuantity calls service with correct ids', async () => {
    const { fixture, inventoryServiceMock } = await setup();
    inventoryServiceMock.getInventoryByProductAndLocation.mockReturnValue(
      of({ data: { quantityOnHand: 0 } })
    );
    const comp = fixture.componentInstance;
    comp.form.patchValue({ productId: 5, locationId: 7 });
    comp.refreshCurrentQuantity();
    expect(inventoryServiceMock.getInventoryByProductAndLocation).toHaveBeenCalledWith(5, 7);
  });

  it('refreshCurrentQuantity resets quantity when productId is missing', async () => {
    const { fixture } = await setup();
    const comp = fixture.componentInstance;
    comp.currentQuantity.set(100);
    comp.form.patchValue({ productId: null, locationId: 1 });
    comp.refreshCurrentQuantity();
    expect(comp.currentQuantity()).toBe(0);
  });

  it('refreshCurrentQuantity resets quantity when locationId is missing', async () => {
    const { fixture } = await setup();
    const comp = fixture.componentInstance;
    comp.currentQuantity.set(100);
    comp.form.patchValue({ productId: 1, locationId: null });
    comp.refreshCurrentQuantity();
    expect(comp.currentQuantity()).toBe(0);
  });

  it('refreshCurrentQuantity resets quantity on API error', async () => {
    const { fixture, inventoryServiceMock } = await setup();
    inventoryServiceMock.getInventoryByProductAndLocation.mockReturnValue(
      throwError(() => ({ status: 404 }))
    );
    const comp = fixture.componentInstance;
    comp.currentQuantity.set(100);
    comp.form.patchValue({ productId: 1, locationId: 1 });
    comp.refreshCurrentQuantity();
    await new Promise(resolve => setTimeout(resolve, 50));
    expect(comp.currentQuantity()).toBe(0);
  });

  it('refreshCurrentQuantity handles zero quantity', async () => {
    const { fixture, inventoryServiceMock } = await setup();
    inventoryServiceMock.getInventoryByProductAndLocation.mockReturnValue(
      of({ data: { quantityOnHand: 0 } })
    );
    const comp = fixture.componentInstance;
    comp.form.patchValue({ productId: 1, locationId: 1 });
    comp.refreshCurrentQuantity();
    await new Promise(resolve => setTimeout(resolve, 50));
    expect(comp.currentQuantity()).toBe(0);
  });

  // ── goBack Navigation ─────────────────────────────────────────────────────

  it('goBack navigates to inventory', async () => {
    const { fixture, routerMock } = await setup();
    const comp = fixture.componentInstance;
    comp.goBack();
    expect(routerMock.navigate).toHaveBeenCalledWith(['/inventory']);
  });

  // ── Submit ────────────────────────────────────────────────────────────────

  it('submit does not call service when form is invalid', async () => {
    const { fixture, inventoryServiceMock } = await setup();
    const comp = fixture.componentInstance;
    comp.form.patchValue({
      productId: null,
      locationId: null,
      quantity: null
    });
    comp.submit();
    expect(inventoryServiceMock.receive).not.toHaveBeenCalled();
  });

  it('submit marks all fields as touched on invalid form', async () => {
    const { fixture } = await setup();
    const comp = fixture.componentInstance;
    comp.form.patchValue({
      productId: null,
      locationId: null,
      quantity: null
    });
    comp.submit();
    expect(comp.form.get('productId')?.touched).toBe(true);
    expect(comp.form.get('locationId')?.touched).toBe(true);
    expect(comp.form.get('quantity')?.touched).toBe(true);
  });

  it('submit clears error message at start', async () => {
    const { fixture, inventoryServiceMock } = await setup();
    const subject = new Subject();
    inventoryServiceMock.receive.mockReturnValue(subject.asObservable());
    const comp = fixture.componentInstance;
    comp.errorMessage.set('Previous error');
    comp.form.patchValue({
      productId: 1,
      locationId: 1,
      quantity: 5
    });
    comp.submit();
    expect(comp.errorMessage()).toBe('');
  });

  it('submit sets isSubmitting to true during request', async () => {
    const { fixture, inventoryServiceMock } = await setup();
    const subject = new Subject();
    inventoryServiceMock.receive.mockReturnValue(subject.asObservable());
    const comp = fixture.componentInstance;
    comp.form.patchValue({
      productId: 1,
      locationId: 1,
      quantity: 5
    });
    comp.submit();
    expect(comp.isSubmitting()).toBe(true);
  });

  it('submit calls receive with correct payload', async () => {
    const { fixture, inventoryServiceMock } = await setup();
    inventoryServiceMock.receive.mockReturnValue(of({}));
    const comp = fixture.componentInstance;
    comp.form.patchValue({
      productId: 3,
      locationId: 7,
      quantity: 25,
      referenceId: 'REF-001',
      reason: 'Restock'
    });
    comp.submit();
    expect(inventoryServiceMock.receive).toHaveBeenCalledWith({
      productId: 3,
      locationId: 7,
      quantity: 25,
      referenceId: 'REF-001',
      reason: 'Restock'
    });
  });

  it('submit trims and omits empty referenceId', async () => {
    const { fixture, inventoryServiceMock } = await setup();
    inventoryServiceMock.receive.mockReturnValue(of({}));
    const comp = fixture.componentInstance;
    comp.form.patchValue({
      productId: 1,
      locationId: 1,
      quantity: 5,
      referenceId: '   ',
      reason: 'Reason'
    });
    comp.submit();
    expect(inventoryServiceMock.receive).toHaveBeenCalledWith(
      expect.objectContaining({
        referenceId: undefined
      })
    );
  });

  it('submit trims and omits empty reason', async () => {
    const { fixture, inventoryServiceMock } = await setup();
    inventoryServiceMock.receive.mockReturnValue(of({}));
    const comp = fixture.componentInstance;
    comp.form.patchValue({
      productId: 1,
      locationId: 1,
      quantity: 5,
      referenceId: 'REF',
      reason: '   '
    });
    comp.submit();
    expect(inventoryServiceMock.receive).toHaveBeenCalledWith(
      expect.objectContaining({
        reason: undefined
      })
    );
  });

  it('submit trims whitespace from optional fields', async () => {
    const { fixture, inventoryServiceMock } = await setup();
    inventoryServiceMock.receive.mockReturnValue(of({}));
    const comp = fixture.componentInstance;
    comp.form.patchValue({
      productId: 1,
      locationId: 1,
      quantity: 5,
      referenceId: '  REF-001  ',
      reason: '  Restocking  '
    });
    comp.submit();
    expect(inventoryServiceMock.receive).toHaveBeenCalledWith(
      expect.objectContaining({
        referenceId: 'REF-001',
        reason: 'Restocking'
      })
    );
  });

  it('submit navigates to inventory on success', async () => {
    const { fixture, inventoryServiceMock, routerMock } = await setup();
    inventoryServiceMock.receive.mockReturnValue(of({}));
    const comp = fixture.componentInstance;
    comp.form.patchValue({
      productId: 1,
      locationId: 1,
      quantity: 5
    });
    comp.submit();
    expect(routerMock.navigate).toHaveBeenCalledWith(['/inventory']);
  });

  it('submit handles 422 unprocessable entity error', async () => {
    const { fixture, inventoryServiceMock } = await setup();
    inventoryServiceMock.receive.mockReturnValue(
      throwError(() => ({ status: 422, message: 'Validation failed' }))
    );
    const comp = fixture.componentInstance;
    comp.form.patchValue({
      productId: 1,
      locationId: 1,
      quantity: 5
    });
    comp.submit();
    await new Promise(resolve => setTimeout(resolve, 50));
    expect(comp.errorMessage()).toBe('Product or location is inactive.');
    expect(comp.isSubmitting()).toBe(false);
  });

  it('submit uses error message from response when not 422', async () => {
    const { fixture, inventoryServiceMock } = await setup();
    inventoryServiceMock.receive.mockReturnValue(
      throwError(() => ({ status: 500, message: 'Server error occurred' }))
    );
    const comp = fixture.componentInstance;
    comp.form.patchValue({
      productId: 1,
      locationId: 1,
      quantity: 5
    });
    comp.submit();
    await new Promise(resolve => setTimeout(resolve, 50));
    expect(comp.errorMessage()).toBe('Server error occurred');
    expect(comp.isSubmitting()).toBe(false);
  });

  it('submit falls back to generic message when error has no message', async () => {
    const { fixture, inventoryServiceMock } = await setup();
    inventoryServiceMock.receive.mockReturnValue(
      throwError(() => ({ status: 500 }))
    );
    const comp = fixture.componentInstance;
    comp.form.patchValue({
      productId: 1,
      locationId: 1,
      quantity: 5
    });
    comp.submit();
    await new Promise(resolve => setTimeout(resolve, 50));
    expect(comp.errorMessage()).toBe('Failed to increase stock.');
    expect(comp.isSubmitting()).toBe(false);
  });

  it('submit does not navigate on error', async () => {
    const { fixture, inventoryServiceMock, routerMock } = await setup();
    inventoryServiceMock.receive.mockReturnValue(
      throwError(() => ({ status: 500, message: 'Error' }))
    );
    const comp = fixture.componentInstance;
    comp.form.patchValue({
      productId: 1,
      locationId: 1,
      quantity: 5
    });
    comp.submit();
    await new Promise(resolve => setTimeout(resolve, 50));
    expect(routerMock.navigate).not.toHaveBeenCalled();
  });

  // ── Edge Cases ────────────────────────────────────────────────────────────

  it('handles large quantity values', async () => {
    const { fixture } = await setup();
    const comp = fixture.componentInstance;
    comp.form.patchValue({ quantity: 999999 });
    expect(comp.form.valid).toBe(false); // Missing product and location
    comp.form.patchValue({ productId: 1, locationId: 1 });
    expect(comp.form.valid).toBe(true);
  });

  it('handles large quantity values in projectedQuantity', async () => {
    const { fixture } = await setup();
    const comp = fixture.componentInstance;
    comp.currentQuantity.set(1000);
    comp.form.patchValue({ quantity: 5000 });
    expect(comp.projectedQuantity()).toBe(6000);
  });

  it('projectedQuantity handles currentQuantity of zero', async () => {
    const { fixture } = await setup();
    const comp = fixture.componentInstance;
    comp.currentQuantity.set(0);
    comp.form.patchValue({ quantity: 10 });
    expect(comp.projectedQuantity()).toBe(10);
  });

  it('submit handles null error object gracefully', async () => {
    const { fixture, inventoryServiceMock } = await setup();
    inventoryServiceMock.receive.mockReturnValue(
      throwError(() => null)
    );
    const comp = fixture.componentInstance;
    comp.form.patchValue({
      productId: 1,
      locationId: 1,
      quantity: 5
    });
    comp.submit();
    await new Promise(resolve => setTimeout(resolve, 50));
    expect(comp.errorMessage()).toBe('Failed to increase stock.');
  });
});
