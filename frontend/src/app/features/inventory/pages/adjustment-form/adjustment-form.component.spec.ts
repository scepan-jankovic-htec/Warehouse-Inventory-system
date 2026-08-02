import '@angular/compiler';
import { FormBuilder } from '@angular/forms';
import { Router } from '@angular/router';
import { of } from 'rxjs';
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
  it('requires non-zero quantity delta', () => {
    const { component } = createComponent();

    component.form.patchValue({ quantityDelta: 0 });
    component.form.controls.quantityDelta.markAsTouched();

    expect(component.form.controls.quantityDelta.hasError('nonZero')).toBe(true);
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

  it('submit — valid adjustment — navigates to inventory', () => {
    const { component, routerMock } = createComponent(8);

    component.currentQuantity.set(8);
    component.form.patchValue({
      productId: 1,
      locationId: 1,
      quantityDelta: -2,
      reason: 'Damage',
      referenceId: 'ADJ-1',
    });

    component.submit();

    expect(routerMock.navigate).toHaveBeenCalledWith(['/inventory']);
  });
});
