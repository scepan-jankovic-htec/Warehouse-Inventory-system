import '@angular/compiler';
import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';
import { Router } from '@angular/router';
import { InventoryService } from '../../services/inventory.service';
import { InventoryOverviewComponent } from './inventory-overview.component';

describe('InventoryOverviewComponent', () => {
  function createComponent() {
    const inventoryServiceMock = {
      inventoryList: signal([
        {
          id: 1,
          product: { id: 10, sku: 'BAT-AA-4P', name: 'AA Battery 4-Pack', unitOfMeasure: 'PACK', reorderThreshold: 50 },
          location: { id: 1, name: 'Warehouse A', type: 'WAREHOUSE' },
          quantityOnHand: 20,
          stockStatus: 'LOW_STOCK',
          updatedAt: '2026-08-01T00:00:00Z',
        },
      ]),
      isLoading: signal(false),
      totalElements: signal(1),
      totalPages: signal(1),
      movements: signal([]),
      isLoadingMovements: signal(false),
      loadInventory: vi.fn(() => of({ data: [], pagination: { page: 1, size: 20, totalElements: 0, totalPages: 0 } })),
      loadMovements: vi.fn(() => of({ data: [], pagination: { page: 1, size: 10, totalElements: 0, totalPages: 0 } })),
    };
    const routerMock = { navigate: vi.fn() };

    TestBed.configureTestingModule({
      imports: [InventoryOverviewComponent],
      providers: [
        { provide: InventoryService, useValue: inventoryServiceMock },
        { provide: Router, useValue: routerMock },
      ],
    });

    const fixture = TestBed.createComponent(InventoryOverviewComponent);
    return { fixture, component: fixture.componentInstance, routerMock, inventoryServiceMock };
  }

  it('ngOnInit — loads inventory and history', () => {
    const { fixture, inventoryServiceMock } = createComponent();

    fixture.componentInstance.ngOnInit();

    expect(inventoryServiceMock.loadInventory).toHaveBeenCalled();
    expect(inventoryServiceMock.loadMovements).toHaveBeenCalled();
  });

  it('format helpers — known values — returns readable labels', () => {
    const { component } = createComponent();

    expect(component.formatStockStatus('LOW_STOCK')).toBe('Low stock');
    expect(component.formatMovementType('TRANSFER_OUT')).toBe('Transfer out');
  });

  it('goToReceive/Transfer/Adjust — navigates to movement forms', () => {
    const { component, routerMock } = createComponent();

    component.goToReceive();
    component.goToTransfer();
    component.goToAdjust();

    expect(routerMock.navigate).toHaveBeenNthCalledWith(1, ['/inventory/receive']);
    expect(routerMock.navigate).toHaveBeenNthCalledWith(2, ['/inventory/transfer']);
    expect(routerMock.navigate).toHaveBeenNthCalledWith(3, ['/inventory/adjust']);
  });
});
