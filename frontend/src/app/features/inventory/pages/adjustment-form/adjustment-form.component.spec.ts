import '@angular/compiler';
import { FormBuilder } from '@angular/forms';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';
import { AdjustmentFormComponent } from './adjustment-form.component';

function createComponent(currentQty = 5): {
  component: AdjustmentFormComponent;
  routerMock: { navigate: ReturnType<typeof vi.fn> };
  inventoryServiceMock: {
    getProductOptions: ReturnType<typeof vi.fn>;
    getLocationOptions: ReturnType<typeof vi.fn>;
    getInventoryByProductAndLocation: ReturnType<typeof vi.fn>;
    adjust: ReturnType<typeof vi.fn>;
  };
} {
  const inventoryServiceMock = {
    getProductOptions: vi.fn(() => of({ data: [], pagination: { page: 1, size: 20, totalElements: 0, totalPages: 0 } })),
    getLocationOptions: vi.fn(() => of({ data: [], pagination: { page: 1, size: 20, totalElements: 0, totalPages: 0 } })),
    getInventoryByProductAndLocation: vi.fn(() => of({ data: { quantityOnHand: currentQty } })),
    adjust: vi.fn(() => of({ data: {} })),
  };

  const routerMock = { navigate: vi.fn() };

  return {
    component: new AdjustmentFormComponent(new FormBuilder(), routerMock as unknown as Router, inventoryServiceMock as never),
    routerMock,
    inventoryServiceMock,
  };
}

describe('AdjustmentFormComponent', () => {
  it('ngOnInit — successful loads — populates products and locations', () => {
    const { component } = createComponent();

    component.ngOnInit();

    expect(component.products()).toEqual([]);
    expect(component.locations()).toEqual([]);
  });

  it('ngOnInit — product load fails — sets error message', () => {
    const { component, inventoryServiceMock } = createComponent();

    inventoryServiceMock.getProductOptions.mockReturnValueOnce(throwError(() => new Error('load failed')));

    component.ngOnInit();

    expect(component.errorMessage()).toBe('Failed to load products.');
  });

  it('ngOnInit — location load fails — sets error message', () => {
    const { component, inventoryServiceMock } = createComponent();

    inventoryServiceMock.getLocationOptions.mockReturnValueOnce(throwError(() => new Error('load failed')));

    component.ngOnInit();

    expect(component.errorMessage()).toBe('Failed to load locations.');
  });

  it('requires non-zero quantity delta', () => {
    const { component } = createComponent();

    component.form.patchValue({ quantityDelta: 0 });
    component.form.controls.quantityDelta.markAsTouched();

    expect(component.form.controls.quantityDelta.hasError('nonZero')).toBe(true);
  });

  it('showError — untouched control — returns false', () => {
    const { component } = createComponent();

    component.form.controls.reason.setValue('');

    expect(component.showError('reason', 'required')).toBe(false);
  });

  it('showError — touched invalid control — returns true', () => {
    const { component } = createComponent();

    component.form.controls.reason.markAsTouched();
    component.form.controls.reason.setValue('');

    expect(component.showError('reason', 'required')).toBe(true);
  });

  it('refreshCurrentQuantity — missing selection — resets current quantity', () => {
    const { component, inventoryServiceMock } = createComponent();

    component.currentQuantity.set(9);
    component.form.patchValue({ productId: 1, locationId: null });

    component.refreshCurrentQuantity();

    expect(component.currentQuantity()).toBe(0);
    expect(inventoryServiceMock.getInventoryByProductAndLocation).not.toHaveBeenCalled();
  });

  it('refreshCurrentQuantity — valid selection — loads quantity on hand', () => {
    const { component, inventoryServiceMock } = createComponent(11);

    component.form.patchValue({ productId: 3, locationId: 7 });

    component.refreshCurrentQuantity();

    expect(inventoryServiceMock.getInventoryByProductAndLocation).toHaveBeenCalledWith(3, 7);
    expect(component.currentQuantity()).toBe(11);
  });

  it('refreshCurrentQuantity — inventory load fails — resets current quantity', () => {
    const { component, inventoryServiceMock } = createComponent();

    inventoryServiceMock.getInventoryByProductAndLocation.mockReturnValueOnce(
      throwError(() => new Error('inventory failed'))
    );
    component.currentQuantity.set(6);
    component.form.patchValue({ productId: 3, locationId: 7 });

    component.refreshCurrentQuantity();

    expect(component.currentQuantity()).toBe(0);
  });

  it('projectedQuantity — current quantity plus delta — returns computed total', () => {
    const { component } = createComponent();

    component.currentQuantity.set(10);
    component.form.patchValue({ quantityDelta: -4 });

    expect(component.projectedQuantity()).toBe(6);
  });

  it('goBack — called — navigates to inventory', () => {
    const { component, routerMock } = createComponent();

    component.goBack();

    expect(routerMock.navigate).toHaveBeenCalledWith(['/inventory']);
  });

  it('blocks submit when projected quantity is negative', () => {
    const { component } = createComponent();

    component.currentQuantity.set(2);
    component.form.patchValue({
      productId: 1,
      locationId: 1,
      quantityDelta: -3,
      reason: 'Damage',
      referenceId: 'ADJ-1',
    });

    component.submit();

    expect(component.errorMessage()).toBe('Adjustment would result in negative stock.');
  });

  it('submit — invalid form — marks controls touched and does not call adjust', () => {
    const { component, inventoryServiceMock } = createComponent();

    component.form.patchValue({
      productId: 1,
      locationId: 1,
      quantityDelta: 2,
      reason: '',
    });

    component.submit();

    expect(component.form.controls.reason.touched).toBe(true);
    expect(inventoryServiceMock.adjust).not.toHaveBeenCalled();
  });

  it('submit — valid adjustment — navigates to inventory', () => {
    const { component, routerMock, inventoryServiceMock } = createComponent(8);

    component.currentQuantity.set(8);
    component.form.patchValue({
      productId: 1,
      locationId: 1,
      quantityDelta: -2,
      reason: ' Damage ',
      referenceId: ' ADJ-1 ',
    });

    component.submit();

    expect(inventoryServiceMock.adjust).toHaveBeenCalledWith({
      productId: 1,
      locationId: 1,
      quantityDelta: -2,
      reason: 'Damage',
      referenceId: 'ADJ-1',
    });
    expect(routerMock.navigate).toHaveBeenCalledWith(['/inventory']);
  });

  it('submit — blank reference id — sends undefined reference', () => {
    const { component, inventoryServiceMock } = createComponent(8);

    component.currentQuantity.set(8);
    component.form.patchValue({
      productId: 1,
      locationId: 1,
      quantityDelta: 2,
      reason: 'Cycle count',
      referenceId: '   ',
    });

    component.submit();

    expect(inventoryServiceMock.adjust).toHaveBeenCalledWith({
      productId: 1,
      locationId: 1,
      quantityDelta: 2,
      reason: 'Cycle count',
      referenceId: undefined,
    });
  });

  it('submit — 422 error — shows business rule message and clears submitting state', () => {
    const { component, inventoryServiceMock } = createComponent(8);

    inventoryServiceMock.adjust.mockReturnValueOnce(throwError(() => ({ status: 422 })));
    component.currentQuantity.set(8);
    component.form.patchValue({
      productId: 1,
      locationId: 1,
      quantityDelta: -2,
      reason: 'Damage',
      referenceId: 'ADJ-1',
    });

    component.submit();

    expect(component.isSubmitting()).toBe(false);
    expect(component.errorMessage()).toBe('Adjustment rejected: negative result or inactive resources.');
  });

  it('submit — generic error with message — shows API message and clears submitting state', () => {
    const { component, inventoryServiceMock } = createComponent(8);

    inventoryServiceMock.adjust.mockReturnValueOnce(
      throwError(() => ({ status: 500, message: 'Unexpected failure' }))
    );
    component.currentQuantity.set(8);
    component.form.patchValue({
      productId: 1,
      locationId: 1,
      quantityDelta: 2,
      reason: 'Correction',
      referenceId: 'ADJ-1',
    });

    component.submit();

    expect(component.isSubmitting()).toBe(false);
    expect(component.errorMessage()).toBe('Unexpected failure');
  });

  it('submit — generic error without message — shows fallback message', () => {
    const { component, inventoryServiceMock } = createComponent(8);

    inventoryServiceMock.adjust.mockReturnValueOnce(throwError(() => ({ status: 500 })));
    component.currentQuantity.set(8);
    component.form.patchValue({
      productId: 1,
      locationId: 1,
      quantityDelta: 2,
      reason: 'Correction',
      referenceId: 'ADJ-1',
    });

    component.submit();

    expect(component.errorMessage()).toBe('Failed to apply adjustment.');
  });
});
