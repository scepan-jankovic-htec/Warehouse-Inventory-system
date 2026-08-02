import '@angular/compiler';
import { FormBuilder } from '@angular/forms';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';
import { TransferFormComponent } from './transfer-form.component';

function createComponent(): TransferFormComponent {
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
    getInventoryByProductAndLocation: vi.fn(() => of({ data: { quantityOnHand: 10 } })),
    transfer: vi.fn(() => of({ data: {} })),
  };

  const routerMock = { navigate: vi.fn() } as unknown as Router;

  return new TransferFormComponent(new FormBuilder(), routerMock, inventoryServiceMock as never);
}

describe('TransferFormComponent', () => {
  it('rejects same source and destination location', () => {
    const component = createComponent();

    component.form.patchValue({
      productId: 10,
      sourceLocationId: 1,
      destinationLocationId: 1,
      quantity: 2,
    });

    component.form.updateValueAndValidity();
    expect(component.form.hasError('sameLocation')).toBe(true);
  });
});
