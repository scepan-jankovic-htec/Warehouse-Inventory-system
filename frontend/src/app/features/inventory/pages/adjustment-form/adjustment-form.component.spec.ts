import '@angular/compiler';
import { FormBuilder } from '@angular/forms';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';
import { AdjustmentFormComponent } from './adjustment-form.component';

function createComponent(): AdjustmentFormComponent {
  const inventoryServiceMock = {
    getProductOptions: vi.fn(() => of({ data: [], pagination: { page: 1, size: 20, totalElements: 0, totalPages: 0 } })),
    getLocationOptions: vi.fn(() => of({ data: [], pagination: { page: 1, size: 20, totalElements: 0, totalPages: 0 } })),
    getInventoryByProductAndLocation: vi.fn(() => of({ data: { quantityOnHand: 5 } })),
    adjust: vi.fn(() => of({ data: {} })),
  };

  const routerMock = { navigate: vi.fn() } as unknown as Router;

  return new AdjustmentFormComponent(new FormBuilder(), routerMock, inventoryServiceMock as never);
}

describe('AdjustmentFormComponent', () => {
  it('requires non-zero quantity delta', () => {
    const component = createComponent();

    component.form.patchValue({ quantityDelta: 0 });
    component.form.controls.quantityDelta.markAsTouched();

    expect(component.form.controls.quantityDelta.hasError('nonZero')).toBe(true);
  });

  it('blocks submit when projected quantity is negative', () => {
    const component = createComponent();

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
});
