import '@angular/compiler';
import { FormBuilder } from '@angular/forms';
import { Router } from '@angular/router';
import { of } from 'rxjs';
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

  it('submit — valid transfer — navigates to inventory', () => {
    const { component, routerMock } = createComponent(20);

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

    expect(routerMock.navigate).toHaveBeenCalledWith(['/inventory']);
  });
});
