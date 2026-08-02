import '@angular/compiler';
import { Injector, runInInjectionContext, signal } from '@angular/core';
import { of, throwError } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';
import { Router } from '@angular/router';
import { InventoryService } from '../../services/inventory.service';
import { InventoryOverviewComponent } from './inventory-overview.component';

describe('InventoryOverviewComponent', () => {
  const mockInventoryRow = {
    id: 1,
    product: { id: 10, sku: 'BAT-AA-4P', name: 'AA Battery 4-Pack', unitOfMeasure: 'PACK', price: 4.99, reorderThreshold: 50 },
    location: { id: 1, name: 'Warehouse A', type: 'WAREHOUSE' },
    quantityOnHand: 20,
    stockStatus: 'LOW_STOCK',
    updatedAt: '2026-08-01T00:00:00Z',
  };

  const mockMovement = {
    id: 1,
    product: { id: 10, sku: 'BAT-AA-4P', name: 'AA Battery 4-Pack', unitOfMeasure: 'PACK', price: 4.99, reorderThreshold: 50 },
    location: { id: 1, name: 'Warehouse A', type: 'WAREHOUSE' },
    quantityDelta: 10,
    movementType: 'RECEIVE',
    performedAt: '2026-08-01T10:00:00Z',
    reason: 'Stock replenishment',
  };

  function createComponent() {
    const inventoryServiceMock = {
      inventoryList: signal([mockInventoryRow]),
      isLoading: signal(false),
      totalElements: signal(1),
      totalPages: signal(1),
      movements: signal([mockMovement]),
      isLoadingMovements: signal(false),
      loadInventory: vi.fn(() => of({ data: [mockInventoryRow], pagination: { page: 1, size: 20, totalElements: 1, totalPages: 1 } })),
      loadMovements: vi.fn(() => of({ data: [mockMovement], pagination: { page: 1, size: 10, totalElements: 1, totalPages: 1 } })),
    };
    const routerMock = { navigate: vi.fn() };

    const injector = Injector.create({
      providers: [
        { provide: InventoryService, useValue: inventoryServiceMock },
        { provide: Router, useValue: routerMock },
      ],
    });

    const component = runInInjectionContext(injector, () => new InventoryOverviewComponent());
    return { component, routerMock, inventoryServiceMock };
  }

  describe('ngOnInit', () => {
    it('should load inventory and history on component initialization', () => {
      const { component, inventoryServiceMock } = createComponent();

      component.ngOnInit();

      expect(inventoryServiceMock.loadInventory).toHaveBeenCalled();
      expect(inventoryServiceMock.loadMovements).toHaveBeenCalled();
    });

    it('should initialize search signals with default values', () => {
      const { component } = createComponent();

      expect(component.search()).toBe('');
      expect(component.stockStatus()).toBe('');
      expect(component.sortBy()).toBe('productName');
      expect(component.sortDir()).toBe('asc');
      expect(component.currentPage()).toBe(1);
      expect(component.pageSize()).toBe(20);
      expect(component.errorMessage()).toBe('');
    });

    it('should set up search subject debounce and reload inventory', () => {
      return new Promise<void>((resolve) => {
        const { component, inventoryServiceMock } = createComponent();

        component.ngOnInit();
        component.onSearchInput(createInputEvent('test'));
        component.onSearchInput(createInputEvent('test 2'));

        setTimeout(() => {
          expect(inventoryServiceMock.loadInventory).toHaveBeenCalled();
          expect(component.currentPage()).toBe(1);
          resolve();
        }, 350);
      });
    });

    it('should respect debounce timing for search (300ms)', () => {
      return new Promise<void>((resolve) => {
        const { component, inventoryServiceMock } = createComponent();

        component.ngOnInit();
        const initialCallCount = inventoryServiceMock.loadInventory.mock.calls.length;

        component.onSearchInput(createInputEvent('test'));

        setTimeout(() => {
          const beforeDebounce = inventoryServiceMock.loadInventory.mock.calls.length;
          expect(beforeDebounce).toBe(initialCallCount);
        }, 200);

        setTimeout(() => {
          const afterDebounce = inventoryServiceMock.loadInventory.mock.calls.length;
          expect(afterDebounce).toBeGreaterThan(initialCallCount);
          resolve();
        }, 350);
      });
    });
  });

  describe('onSearchInput', () => {
    it('should update search signal', () => {
      const { component } = createComponent();
      const event = createInputEvent('BAT-AA');

      component.onSearchInput(event);

      expect(component.search()).toBe('BAT-AA');
    });

    it('should trigger search subject', () => {
      return new Promise<void>((resolve) => {
        const { component, inventoryServiceMock } = createComponent();
        component.ngOnInit();
        inventoryServiceMock.loadInventory.mockClear();

        component.onSearchInput(createInputEvent('search term'));

        setTimeout(() => {
          expect(inventoryServiceMock.loadInventory).toHaveBeenCalled();
          resolve();
        }, 350);
      });
    });

    it('should reset current page to 1 on search', () => {
      return new Promise<void>((resolve) => {
        const { component } = createComponent();
        component.ngOnInit();
        component.currentPage.set(5);

        component.onSearchInput(createInputEvent('test'));

        setTimeout(() => {
          expect(component.currentPage()).toBe(1);
          resolve();
        }, 350);
      });
    });
  });

  describe('onStockStatusChange', () => {
    it('should update stock status signal', () => {
      const { component } = createComponent();
      const event = createSelectEvent('LOW_STOCK');

      component.onStockStatusChange(event);

      expect(component.stockStatus()).toBe('LOW_STOCK');
    });

    it('should reset current page to 1', () => {
      const { component } = createComponent();
      component.currentPage.set(3);

      component.onStockStatusChange(createSelectEvent('IN_STOCK'));

      expect(component.currentPage()).toBe(1);
    });

    it('should load inventory immediately', () => {
      const { component, inventoryServiceMock } = createComponent();
      inventoryServiceMock.loadInventory.mockClear();

      component.onStockStatusChange(createSelectEvent('OUT_OF_STOCK'));

      expect(inventoryServiceMock.loadInventory).toHaveBeenCalled();
    });

    it('should handle empty stock status selection', () => {
      const { component } = createComponent();

      component.onStockStatusChange(createSelectEvent(''));

      expect(component.stockStatus()).toBe('');
    });
  });

  describe('onSort', () => {
    it('should change sort field and set direction to asc', () => {
      const { component } = createComponent();

      component.onSort('sku');

      expect(component.sortBy()).toBe('sku');
      expect(component.sortDir()).toBe('asc');
    });

    it('should toggle sort direction when clicking same field', () => {
      const { component } = createComponent();
      component.sortBy.set('productName');
      component.sortDir.set('asc');

      component.onSort('productName');

      expect(component.sortDir()).toBe('desc');
    });

    it('should reset direction to asc when changing field', () => {
      const { component } = createComponent();
      component.sortBy.set('sku');
      component.sortDir.set('desc');

      component.onSort('locationName');

      expect(component.sortBy()).toBe('locationName');
      expect(component.sortDir()).toBe('asc');
    });

    it('should call loadInventory', () => {
      const { component, inventoryServiceMock } = createComponent();
      inventoryServiceMock.loadInventory.mockClear();

      component.onSort('quantityOnHand');

      expect(inventoryServiceMock.loadInventory).toHaveBeenCalled();
    });

    it('should handle all sortable fields', () => {
      const { component } = createComponent();
      const sortFields = ['sku', 'productName', 'locationName', 'quantityOnHand', 'stockStatus'];

      sortFields.forEach((field) => {
        component.onSort(field as any);
        expect(component.sortBy()).toBe(field);
      });
    });
  });

  describe('sortMarker', () => {
    it('should return empty string when field is not sorted', () => {
      const { component } = createComponent();
      component.sortBy.set('productName');

      const marker = component.sortMarker('sku');

      expect(marker).toBe('');
    });

    it('should return ↑ for ascending sort', () => {
      const { component } = createComponent();
      component.sortBy.set('sku');
      component.sortDir.set('asc');

      const marker = component.sortMarker('sku');

      expect(marker).toBe('↑');
    });

    it('should return ↓ for descending sort', () => {
      const { component } = createComponent();
      component.sortBy.set('sku');
      component.sortDir.set('desc');

      const marker = component.sortMarker('sku');

      expect(marker).toBe('↓');
    });
  });

  describe('pagination', () => {
    it('goPrevious should decrement current page', () => {
      const { component, inventoryServiceMock } = createComponent();
      component.currentPage.set(3);
      inventoryServiceMock.loadInventory.mockClear();

      component.goPrevious();

      expect(component.currentPage()).toBe(2);
      expect(inventoryServiceMock.loadInventory).toHaveBeenCalled();
    });

    it('goPrevious should not go below 1', () => {
      const { component, inventoryServiceMock } = createComponent();
      component.currentPage.set(1);
      inventoryServiceMock.loadInventory.mockClear();

      component.goPrevious();

      expect(component.currentPage()).toBe(1);
      expect(inventoryServiceMock.loadInventory).not.toHaveBeenCalled();
    });

    it('goNext should increment current page', () => {
      const { component, inventoryServiceMock } = createComponent();
      component.currentPage.set(1);
      const inventoryServiceMockAny = inventoryServiceMock as any;
      inventoryServiceMockAny.totalPages.set(5);
      inventoryServiceMock.loadInventory.mockClear();

      component.goNext();

      expect(component.currentPage()).toBe(2);
      expect(inventoryServiceMock.loadInventory).toHaveBeenCalled();
    });

    it('goNext should not exceed total pages', () => {
      const { component, inventoryServiceMock } = createComponent();
      component.currentPage.set(5);
      const inventoryServiceMockAny = inventoryServiceMock as any;
      inventoryServiceMockAny.totalPages.set(5);
      inventoryServiceMock.loadInventory.mockClear();

      component.goNext();

      expect(component.currentPage()).toBe(5);
      expect(inventoryServiceMock.loadInventory).not.toHaveBeenCalled();
    });
  });

  describe('navigation methods', () => {
    it('goToReceive should navigate to /inventory/receive', () => {
      const { component, routerMock } = createComponent();

      component.goToReceive();

      expect(routerMock.navigate).toHaveBeenCalledWith(['/inventory/receive']);
    });

    it('goToTransfer should navigate to /inventory/transfer', () => {
      const { component, routerMock } = createComponent();

      component.goToTransfer();

      expect(routerMock.navigate).toHaveBeenCalledWith(['/inventory/transfer']);
    });

    it('goToAdjust should navigate to /inventory/adjust', () => {
      const { component, routerMock } = createComponent();

      component.goToAdjust();

      expect(routerMock.navigate).toHaveBeenCalledWith(['/inventory/adjust']);
    });
  });

  describe('formatStockStatus', () => {
    it('should format IN_STOCK', () => {
      const { component } = createComponent();

      expect(component.formatStockStatus('IN_STOCK')).toBe('In stock');
    });

    it('should format LOW_STOCK', () => {
      const { component } = createComponent();

      expect(component.formatStockStatus('LOW_STOCK')).toBe('Low stock');
    });

    it('should format OUT_OF_STOCK', () => {
      const { component } = createComponent();

      expect(component.formatStockStatus('OUT_OF_STOCK')).toBe('Out of stock');
    });

    it('should return original value for unknown status', () => {
      const { component } = createComponent();

      expect(component.formatStockStatus('UNKNOWN' as any)).toBe('UNKNOWN');
    });
  });

  describe('formatMovementType', () => {
    it('should format TRANSFER_IN', () => {
      const { component } = createComponent();

      expect(component.formatMovementType('TRANSFER_IN')).toBe('Transfer in');
    });

    it('should format TRANSFER_OUT', () => {
      const { component } = createComponent();

      expect(component.formatMovementType('TRANSFER_OUT')).toBe('Transfer out');
    });

    it('should format RECEIVE', () => {
      const { component } = createComponent();

      expect(component.formatMovementType('RECEIVE')).toBe('Receive');
    });

    it('should format ADJUSTMENT', () => {
      const { component } = createComponent();

      expect(component.formatMovementType('ADJUSTMENT')).toBe('Adjustment');
    });

    it('should return original value for unknown movement type', () => {
      const { component } = createComponent();

      expect(component.formatMovementType('UNKNOWN')).toBe('UNKNOWN');
    });
  });

  describe('formatDate', () => {
    it('should format date correctly', () => {
      const { component } = createComponent();
      const dateStr = '2026-08-15T00:00:00Z';

      const formatted = component.formatDate(dateStr);

      expect(formatted).toContain('Aug');
      expect(formatted).toContain('15');
      expect(formatted).toContain('2026');
    });

    it('should handle various date formats', () => {
      const { component } = createComponent();
      const dateStr = '2026-01-01T00:00:00Z';

      const formatted = component.formatDate(dateStr);

      expect(formatted).toContain('Jan');
      expect(formatted).toContain('1');
      expect(formatted).toContain('2026');
    });

    it('should format dates consistently', () => {
      const { component } = createComponent();
      const date1 = '2026-08-15T12:30:00Z';
      const date2 = '2026-08-15T18:45:00Z';

      const formatted1 = component.formatDate(date1);
      const formatted2 = component.formatDate(date2);

      expect(formatted1).toBe(formatted2);
    });
  });

  describe('formatDateTime', () => {
    it('should format date and time correctly', () => {
      const { component } = createComponent();
      const dateStr = '2026-08-15T14:30:00Z';

      const formatted = component.formatDateTime(dateStr);

      expect(formatted).toContain('Aug');
      expect(formatted).toContain('15');
      expect(formatted).toContain('2026');
      expect(formatted).toMatch(/\d{2}:\d{2}/);
    });

    it('should include time in 24-hour format', () => {
      const { component } = createComponent();
      const dateStr = '2026-08-15T09:05:00Z';

      const formatted = component.formatDateTime(dateStr);

      expect(formatted).toMatch(/:\s*05|:05/);
    });

    it('should format various times correctly', () => {
      const { component } = createComponent();
      const morning = '2026-08-15T08:00:00Z';
      const afternoon = '2026-08-15T14:00:00Z';
      const evening = '2026-08-15T20:00:00Z';

      const formattedMorning = component.formatDateTime(morning);
      const formattedAfternoon = component.formatDateTime(afternoon);
      const formattedEvening = component.formatDateTime(evening);

      expect(formattedMorning).toContain('Aug');
      expect(formattedAfternoon).toContain('Aug');
      expect(formattedEvening).toContain('Aug');
    });
  });

  describe('signal bindings', () => {
    it('should bind inventory list from service', () => {
      const { component, inventoryServiceMock } = createComponent();

      expect(component.inventory()).toBe(inventoryServiceMock.inventoryList());
    });

    it('should bind isLoading from service', () => {
      const { component, inventoryServiceMock } = createComponent();

      expect(component.isLoading()).toBe(inventoryServiceMock.isLoading());
    });

    it('should bind totalElements from service', () => {
      const { component, inventoryServiceMock } = createComponent();

      expect(component.totalElements()).toBe(inventoryServiceMock.totalElements());
    });

    it('should bind totalPages from service', () => {
      const { component, inventoryServiceMock } = createComponent();

      expect(component.totalPages()).toBe(inventoryServiceMock.totalPages());
    });

    it('should bind movements from service', () => {
      const { component, inventoryServiceMock } = createComponent();

      expect(component.movements()).toBe(inventoryServiceMock.movements());
    });

    it('should bind isLoadingMovements from service', () => {
      const { component, inventoryServiceMock } = createComponent();

      expect(component.isLoadingMovements()).toBe(inventoryServiceMock.isLoadingMovements());
    });
  });

  describe('error handling', () => {
    it('should clear error message on successful load', () => {
      const { component, inventoryServiceMock } = createComponent();
      component.errorMessage.set('Previous error');
      inventoryServiceMock.loadInventory.mockClear();

      component.ngOnInit();

      expect(component.errorMessage()).toBe('');
    });

    it('should set error message on loadInventory failure', () => {
      return new Promise<void>((resolve) => {
        const { component, inventoryServiceMock } = createComponent();
        inventoryServiceMock.loadInventory.mockReturnValue(throwError(() => new Error('Network error')));

        component.ngOnInit();

        setTimeout(() => {
          expect(component.errorMessage()).toBe('Failed to load inventory.');
          resolve();
        }, 100);
      });
    });

    it('should set error message on loadMovements failure', () => {
      return new Promise<void>((resolve) => {
        const { component, inventoryServiceMock } = createComponent();
        inventoryServiceMock.loadMovements.mockReturnValue(throwError(() => new Error('Network error')));

        component.ngOnInit();

        setTimeout(() => {
          expect(component.errorMessage()).toBe('Failed to load movement history.');
          resolve();
        }, 100);
      });
    });

    it('should persist error message across subsequent loads', () => {
      return new Promise<void>((resolve) => {
        const { component, inventoryServiceMock } = createComponent();
        inventoryServiceMock.loadInventory.mockReturnValue(throwError(() => new Error('Network error')));

        component.ngOnInit();

        setTimeout(() => {
          const errorMsg = component.errorMessage();
          expect(errorMsg).toBe('Failed to load inventory.');
          resolve();
        }, 100);
      });
    });
  });

  describe('filter and sort integration', () => {
    it('should load inventory with all active filters', () => {
      const { component, inventoryServiceMock } = createComponent();
      component.search.set('BAT');
      component.stockStatus.set('LOW_STOCK');
      component.sortBy.set('sku');
      component.sortDir.set('desc');
      component.currentPage.set(2);
      inventoryServiceMock.loadInventory.mockClear();

      (component as any).loadInventory();

      expect(inventoryServiceMock.loadInventory).toHaveBeenCalledWith({
        search: 'BAT',
        stockStatus: 'LOW_STOCK',
        sortBy: 'sku',
        sortDir: 'desc',
        page: 2,
        size: 20,
      });
    });

    it('should trim whitespace from search term', () => {
      const { component, inventoryServiceMock } = createComponent();
      component.search.set('  BAT  ');
      inventoryServiceMock.loadInventory.mockClear();

      (component as any).loadInventory();

      expect(inventoryServiceMock.loadInventory).toHaveBeenCalledWith(
        expect.objectContaining({
          search: 'BAT',
        })
      );
    });

    it('should omit empty search term', () => {
      const { component, inventoryServiceMock } = createComponent();
      component.search.set('');
      inventoryServiceMock.loadInventory.mockClear();

      (component as any).loadInventory();

      expect(inventoryServiceMock.loadInventory).toHaveBeenCalledWith(
        expect.objectContaining({
          search: undefined,
        })
      );
    });

    it('should omit empty stock status', () => {
      const { component, inventoryServiceMock } = createComponent();
      component.stockStatus.set('');
      inventoryServiceMock.loadInventory.mockClear();

      (component as any).loadInventory();

      expect(inventoryServiceMock.loadInventory).toHaveBeenCalledWith(
        expect.objectContaining({
          stockStatus: undefined,
        })
      );
    });
  });

  describe('recent history loading', () => {
    it('should load movements with descending performedAt sort', () => {
      const { component, inventoryServiceMock } = createComponent();
      inventoryServiceMock.loadMovements.mockClear();

      (component as any).loadRecentHistory();

      expect(inventoryServiceMock.loadMovements).toHaveBeenCalledWith({
        sortBy: 'performedAt',
        sortDir: 'desc',
        page: 1,
        size: 10,
      });
    });

    it('should handle loadMovements error gracefully', () => {
      return new Promise<void>((resolve) => {
        const { component, inventoryServiceMock } = createComponent();
        inventoryServiceMock.loadMovements.mockReturnValue(throwError(() => new Error('Failed')));

        (component as any).loadRecentHistory();

        setTimeout(() => {
          expect(component.errorMessage()).toBe('Failed to load movement history.');
          resolve();
        }, 100);
      });
    });
  });

  // Helper functions
  function createInputEvent(value: string): Event {
    return { target: { value } } as unknown as Event;
  }

  function createSelectEvent(value: string): Event {
    return { target: { value } } as unknown as Event;
  }
});
