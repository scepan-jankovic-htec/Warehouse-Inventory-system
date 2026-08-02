import '@angular/compiler';
import { FormBuilder } from '@angular/forms';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';
import { TransferFormComponent } from './transfer-form.component';

function createComponent(sourceQty = 10): {
  component: TransferFormComponent;
  inventoryServiceMock: {
    getProductOptions: ReturnType<typeof vi.fn>;
    getLocationOptions: ReturnType<typeof vi.fn>;
    getInventoryByProductAndLocation: ReturnType<typeof vi.fn>;
    transfer: ReturnType<typeof vi.fn>;
  };
  routerMock: { navigate: ReturnType<typeof vi.fn> };
} {
  const inventoryServiceMock = {
    getProductOptions: vi.fn(() => of({ data: [], pagination: { page: 1, size: 20, totalElements: 0, totalPages: 0 } })),
    getLocationOptions: vi.fn(() =>
      of({
        data: [
          { id: 1, name: 'Warehouse A', type: 'WAREHOUSE', address: null, active: true, createdAt: '', updatedAt: '' },
          { id: 2, name: 'Store 01', type: 'STORE', address: null, active: true, createdAt: '', updatedAt: '' },
        ],
        pagination: { page: 1, size: 20, totalElements: 2, totalPages: 1 },
      })
    ),
    getInventoryByProductAndLocation: vi.fn(() => of({ data: { quantityOnHand: sourceQty } })),
    transfer: vi.fn(() => of({ data: {} })),
  };

  const routerMock = { navigate: vi.fn() };

  return {
    component: new TransferFormComponent(new FormBuilder(), routerMock as unknown as Router, inventoryServiceMock as never),
    inventoryServiceMock,
    routerMock,
  };
}

describe('TransferFormComponent', () => {
  it('loads product and location options on init', () => {
    const { component, inventoryServiceMock } = createComponent();

    component.ngOnInit();

    expect(inventoryServiceMock.getProductOptions).toHaveBeenCalledTimes(1);
    expect(inventoryServiceMock.getLocationOptions).toHaveBeenCalledTimes(1);
    expect(component.locations()).toHaveLength(2);
  });

  it('sets error message when option loading fails', () => {
    const { component, inventoryServiceMock } = createComponent();
    inventoryServiceMock.getProductOptions.mockReturnValueOnce(throwError(() => new Error('boom')));

    component.ngOnInit();

    expect(component.errorMessage()).toBe('Failed to load products.');
  });

  it('sets error message when location options loading fails', () => {
    const { component, inventoryServiceMock } = createComponent();
    inventoryServiceMock.getLocationOptions.mockReturnValueOnce(throwError(() => new Error('loc-error')));

    component.ngOnInit();

    expect(component.errorMessage()).toBe('Failed to load locations.');
  });

  it('rejects same source and destination location', () => {
    const { component } = createComponent();

    component.form.patchValue({
      productId: 10,
      sourceLocationId: 1,
      destinationLocationId: 1,
      quantity: 2,
    });

    component.form.updateValueAndValidity();
    expect(component.form.hasError('sameLocation')).toBe(true);
  });

  it('shows touched control errors', () => {
    const { component } = createComponent();

    component.form.controls.productId.markAsTouched();
    component.form.controls.productId.setValue(null);

    expect(component.showError('productId', 'required')).toBe(true);
  });

  it('refreshes source and destination quantities from selected product and locations', () => {
    const { component, inventoryServiceMock } = createComponent(12);
    inventoryServiceMock.getInventoryByProductAndLocation
      .mockReturnValueOnce(of({ data: { quantityOnHand: 12 } }))
      .mockReturnValueOnce(of({ data: { quantityOnHand: 4 } }));

    component.form.patchValue({
      productId: 10,
      sourceLocationId: 1,
      destinationLocationId: 2,
    });

    component.refreshQuantities();

    expect(component.sourceCurrentQuantity()).toBe(12);
    expect(component.destinationCurrentQuantity()).toBe(4);
    expect(inventoryServiceMock.getInventoryByProductAndLocation).toHaveBeenNthCalledWith(1, 10, 1);
    expect(inventoryServiceMock.getInventoryByProductAndLocation).toHaveBeenNthCalledWith(2, 10, 2);
  });

  it('resets quantities to zero when refresh prerequisites are missing', () => {
    const { component, inventoryServiceMock } = createComponent(12);

    component.sourceCurrentQuantity.set(8);
    component.destinationCurrentQuantity.set(6);
    component.form.patchValue({ productId: null, sourceLocationId: null, destinationLocationId: null });

    component.refreshQuantities();

    expect(component.sourceCurrentQuantity()).toBe(0);
    expect(component.destinationCurrentQuantity()).toBe(0);
    expect(inventoryServiceMock.getInventoryByProductAndLocation).not.toHaveBeenCalled();
  });

  it('sets quantity to zero when inventory lookup fails', () => {
    const { component, inventoryServiceMock } = createComponent();
    inventoryServiceMock.getInventoryByProductAndLocation.mockReturnValueOnce(throwError(() => new Error('missing')));

    component.sourceCurrentQuantity.set(9);
    component.form.patchValue({ productId: 10, sourceLocationId: 1 });

    component.refreshQuantities();

    expect(component.sourceCurrentQuantity()).toBe(0);
  });

  it('sets destination quantity to zero when destination lookup fails', () => {
    const { component, inventoryServiceMock } = createComponent();
    inventoryServiceMock.getInventoryByProductAndLocation
      .mockReturnValueOnce(of({ data: { quantityOnHand: 5 } }))
      .mockReturnValueOnce(throwError(() => new Error('dest-missing')));

    component.destinationCurrentQuantity.set(7);
    component.form.patchValue({ productId: 10, sourceLocationId: 1, destinationLocationId: 2 });

    component.refreshQuantities();

    expect(component.destinationCurrentQuantity()).toBe(0);
  });

  it('computes projected source quantity', () => {
    const { component } = createComponent();

    component.sourceCurrentQuantity.set(15);
    component.form.patchValue({ quantity: 4 });

    expect(component.sourceProjectedQuantity()).toBe(11);
  });

  it('submit — requested quantity exceeds source — sets insufficientClientStock error', () => {
    const { component } = createComponent(2);

    component.sourceCurrentQuantity.set(2);
    component.form.patchValue({
      productId: 10,
      sourceLocationId: 1,
      destinationLocationId: 2,
      quantity: 5,
    });

    component.submit();

    expect(component.form.hasError('insufficientClientStock')).toBe(true);
  });

  it('submit clears stale insufficientClientStock error before valid submit', () => {
    const { component, inventoryServiceMock } = createComponent(20);

    component.sourceCurrentQuantity.set(20);
    component.form.setErrors({ insufficientClientStock: true });
    component.form.patchValue({
      productId: 10,
      sourceLocationId: 1,
      destinationLocationId: 2,
      quantity: 5,
    });

    component.submit();

    expect(component.form.hasError('insufficientClientStock')).toBe(false);
    expect(inventoryServiceMock.transfer).toHaveBeenCalledTimes(1);
  });

  it('submit clears insufficientClientStock while preserving other form errors', () => {
    const { component } = createComponent(20);

    component.sourceCurrentQuantity.set(20);
    component.form.patchValue({
      productId: 10,
      sourceLocationId: 1,
      destinationLocationId: 2,
      quantity: 5,
    });

    // Prevent updateValueAndValidity from re-running validators (which would clear setErrors)
    vi.spyOn(component.form, 'updateValueAndValidity').mockImplementation(() => {});
    // Simulate a prior submit that left both a domain error and the stale flag
    component.form.setErrors({ insufficientClientStock: true, someOtherError: true });

    component.submit();

    expect(component.form.hasError('insufficientClientStock')).toBe(false);
    expect(component.form.hasError('someOtherError')).toBe(true);
  });

  it('submit marks controls touched and aborts when form is invalid', () => {
    const { component, inventoryServiceMock } = createComponent();

    component.form.patchValue({ quantity: 0 });

    component.submit();

    expect(component.form.controls.productId.touched).toBe(true);
    expect(inventoryServiceMock.transfer).not.toHaveBeenCalled();
  });

  it('submit — valid transfer — navigates to inventory', () => {
    const { component, inventoryServiceMock, routerMock } = createComponent(20);

    component.sourceCurrentQuantity.set(20);
    component.form.patchValue({
      productId: 10,
      sourceLocationId: 1,
      destinationLocationId: 2,
      quantity: 5,
      referenceId: 'TR-1',
      reason: 'Move stock',
    });

    component.submit();

    expect(component.isSubmitting()).toBe(true);
    expect(inventoryServiceMock.transfer).toHaveBeenCalledWith({
      productId: 10,
      sourceLocationId: 1,
      destinationLocationId: 2,
      quantity: 5,
      referenceId: 'TR-1',
      reason: 'Move stock',
    });
    expect(routerMock.navigate).toHaveBeenCalledWith(['/inventory']);
  });

  it('submit trims optional fields and omits empty values', () => {
    const { component, inventoryServiceMock } = createComponent(20);

    component.sourceCurrentQuantity.set(20);
    component.form.patchValue({
      productId: 10,
      sourceLocationId: 1,
      destinationLocationId: 2,
      quantity: 5,
      referenceId: '   ',
      reason: '  ',
    });

    component.submit();

    expect(inventoryServiceMock.transfer).toHaveBeenCalledWith({
      productId: 10,
      sourceLocationId: 1,
      destinationLocationId: 2,
      quantity: 5,
      referenceId: undefined,
      reason: undefined,
    });
  });

  it('maps 422 transfer error to domain message', () => {
    const { component, inventoryServiceMock } = createComponent(20);
    inventoryServiceMock.transfer.mockReturnValueOnce(
      throwError(() => ({ status: 422, message: 'validation failed' }))
    );

    component.sourceCurrentQuantity.set(20);
    component.form.patchValue({
      productId: 10,
      sourceLocationId: 1,
      destinationLocationId: 2,
      quantity: 5,
    });

    component.submit();

    expect(component.isSubmitting()).toBe(false);
    expect(component.errorMessage()).toBe('Insufficient stock or inactive resources.');
  });

  it('maps non-422 transfer error to API message fallback', () => {
    const { component, inventoryServiceMock } = createComponent(20);
    inventoryServiceMock.transfer.mockReturnValueOnce(
      throwError(() => ({ status: 500, message: 'Transfer failed badly' }))
    );

    component.sourceCurrentQuantity.set(20);
    component.form.patchValue({
      productId: 10,
      sourceLocationId: 1,
      destinationLocationId: 2,
      quantity: 5,
    });

    component.submit();

    expect(component.errorMessage()).toBe('Transfer failed badly');
  });

  it('navigates back to inventory', () => {
    const { component, routerMock } = createComponent();

    component.goBack();

    expect(routerMock.navigate).toHaveBeenCalledWith(['/inventory']);
  });
});
