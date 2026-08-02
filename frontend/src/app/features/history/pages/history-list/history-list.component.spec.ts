import '@angular/compiler';
import { Injector, runInInjectionContext, signal } from '@angular/core';
import { of, throwError } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';
import { PagedResponse } from '../../../../core/models/api-response.model';
import { MovementType } from '../../../../core/models/api-enums.model';
import { LocationResponse } from '../../../locations/models/location.model';
import { ProductResponse } from '../../../products/models/product.model';
import { HistoryEntryModel } from '../../models/history-entry.model';
import { HistoryListComponent } from './history-list.component';
import { HistoryService } from '../../services/history.service';

type HistoryServiceMock = {
  history: ReturnType<typeof signal<HistoryEntryModel[]>>;
  isLoading: ReturnType<typeof signal<boolean>>;
  totalElements: ReturnType<typeof signal<number>>;
  totalPages: ReturnType<typeof signal<number>>;
  currentPage: ReturnType<typeof signal<number>>;
  loadAll: ReturnType<typeof vi.fn>;
  getProductOptions: ReturnType<typeof vi.fn>;
  getLocationOptions: ReturnType<typeof vi.fn>;
};

function createProduct(id: number, name: string): ProductResponse {
  return {
    id,
    sku: `SKU-${id}`,
    name,
    description: null,
    category: { id: 1, name: 'Category' },
    unitOfMeasure: 'EA',
    reorderThreshold: 5,
    active: true,
    createdAt: '2026-08-01T10:00:00',
    updatedAt: '2026-08-01T10:00:00',
  };
}

function createLocation(id: number, name: string): LocationResponse {
  return {
    id,
    name,
    type: 'WAREHOUSE',
    address: null,
    active: true,
    createdAt: '2026-08-01T10:00:00',
    updatedAt: '2026-08-01T10:00:00',
  };
}

function createPagedResponse<T>(data: T[]): PagedResponse<T> {
  return {
    data,
    pagination: {
      page: 1,
      size: 20,
      totalElements: data.length,
      totalPages: data.length > 0 ? 1 : 0,
    },
  };
}

function createMovement(type: MovementType, delta: number): HistoryEntryModel {
  return {
    id: 11,
    movementType: type,
    product: { id: 12, sku: 'SKU-12', name: 'Sample Product' },
    location: { id: 13, name: 'Main Warehouse', type: 'WAREHOUSE' },
    quantityDelta: delta,
    referenceId: 'REF-1',
    reason: 'Test reason',
    transferCounterpartId: null,
    performedBy: { id: 7, username: 'operator', fullName: 'Operator User' },
    performedAt: '2026-08-02T10:30:00',
  };
}

function setup(): {
  component: HistoryListComponent;
  historyServiceMock: HistoryServiceMock;
} {
  const historyServiceMock: HistoryServiceMock = {
    history: signal<HistoryEntryModel[]>([]),
    isLoading: signal(false),
    totalElements: signal(0),
    totalPages: signal(1),
    currentPage: signal(1),
    loadAll: vi.fn(() => of(createPagedResponse<HistoryEntryModel>([]))),
    getProductOptions: vi.fn(() =>
      of(createPagedResponse<ProductResponse>([createProduct(1, 'Product One'), createProduct(2, 'Product Two')]))
    ),
    getLocationOptions: vi.fn(() =>
      of(createPagedResponse<LocationResponse>([createLocation(10, 'Warehouse A'), createLocation(20, 'Warehouse B')]))
    ),
  };

  const injector = Injector.create({
    providers: [{ provide: HistoryService, useValue: historyServiceMock }],
  });

  const component = runInInjectionContext(injector, () => new HistoryListComponent());

  return { component, historyServiceMock };
}

describe('HistoryListComponent', () => {
  it('loads options and default history on init', () => {
    const { component, historyServiceMock } = setup();

    component.ngOnInit();

    expect(historyServiceMock.getProductOptions).toHaveBeenCalledTimes(1);
    expect(historyServiceMock.getLocationOptions).toHaveBeenCalledTimes(1);
    expect(component.productOptions().length).toBe(2);
    expect(component.locationOptions().length).toBe(2);
    expect(historyServiceMock.loadAll).toHaveBeenCalledWith({
      productId: undefined,
      locationId: undefined,
      movementType: undefined,
      dateFrom: undefined,
      dateTo: undefined,
      sortBy: 'performedAt',
      sortDir: 'desc',
      page: 1,
      size: 20,
    });
  });

  it('updates filters from events and applies converted params', () => {
    const { component, historyServiceMock } = setup();
    component.ngOnInit();
    historyServiceMock.loadAll.mockClear();

    component.onProductChange({ target: { value: '2' } } as unknown as Event);
    component.onLocationChange({ target: { value: '20' } } as unknown as Event);
    component.onMovementTypeChange({ target: { value: 'TRANSFER_OUT' } } as unknown as Event);
    component.onDateFromChange({ target: { value: '2026-08-01' } } as unknown as Event);
    component.onDateToChange({ target: { value: '2026-08-03' } } as unknown as Event);
    component.applyFilters();

    expect(historyServiceMock.loadAll).toHaveBeenCalledWith({
      productId: 2,
      locationId: 20,
      movementType: 'TRANSFER_OUT',
      dateFrom: '2026-08-01T00:00:00',
      dateTo: '2026-08-03T23:59:59',
      sortBy: 'performedAt',
      sortDir: 'desc',
      page: 1,
      size: 20,
    });
  });

  it('ignores invalid numeric filters and clears stale error before load', () => {
    const { component, historyServiceMock } = setup();
    component.ngOnInit();
    historyServiceMock.loadAll.mockClear();

    component.errorMessage.set('old error');
    component.selectedProductId.set('not-a-number');
    component.selectedLocationId.set('20x');
    component.applyFilters();

    expect(component.errorMessage()).toBe('');
    expect(historyServiceMock.loadAll).toHaveBeenCalledWith(
      expect.objectContaining({
        productId: undefined,
        locationId: undefined,
      })
    );
  });

  it('resets all filters and loads first page when cleared', () => {
    const { component, historyServiceMock } = setup();
    component.ngOnInit();
    historyServiceMock.loadAll.mockClear();

    component.selectedProductId.set('10');
    component.selectedLocationId.set('20');
    component.selectedMovementType.set('RECEIVE');
    component.dateFrom.set('2026-08-01');
    component.dateTo.set('2026-08-05');
    component.sortBy.set('quantityDelta');
    component.sortDir.set('asc');

    component.clearFilters();

    expect(component.selectedProductId()).toBe('');
    expect(component.selectedLocationId()).toBe('');
    expect(component.selectedMovementType()).toBe('');
    expect(component.dateFrom()).toBe('');
    expect(component.dateTo()).toBe('');
    expect(component.sortBy()).toBe('performedAt');
    expect(component.sortDir()).toBe('desc');
    expect(historyServiceMock.loadAll).toHaveBeenCalledWith(
      expect.objectContaining({
        page: 1,
        sortBy: 'performedAt',
        sortDir: 'desc',
      })
    );
  });

  it('toggles and changes sort direction based on field', () => {
    const { component, historyServiceMock } = setup();
    component.ngOnInit();
    historyServiceMock.loadAll.mockClear();

    component.onSort('performedAt');
    expect(component.sortDir()).toBe('asc');

    component.onSort('quantityDelta');
    expect(component.sortBy()).toBe('quantityDelta');
    expect(component.sortDir()).toBe('asc');

    component.onSort('quantityDelta');
    expect(component.sortDir()).toBe('desc');

    component.onSort('performedAt');
    expect(component.sortBy()).toBe('performedAt');
    expect(component.sortDir()).toBe('desc');
    expect(historyServiceMock.loadAll).toHaveBeenCalledTimes(4);
  });

  it('returns expected sort markers', () => {
    const { component } = setup();

    expect(component.sortMarker('quantityDelta')).toBe('');
    expect(component.sortMarker('performedAt')).toBe('↓');

    component.sortDir.set('asc');
    expect(component.sortMarker('performedAt')).toBe('↑');
  });

  it('handles previous and next pagination boundaries', () => {
    const { component, historyServiceMock } = setup();
    component.ngOnInit();
    historyServiceMock.loadAll.mockClear();

    historyServiceMock.currentPage.set(1);
    historyServiceMock.totalPages.set(3);
    component.goPrevious();
    expect(historyServiceMock.loadAll).not.toHaveBeenCalled();

    historyServiceMock.currentPage.set(2);
    component.goPrevious();
    expect(historyServiceMock.loadAll).toHaveBeenCalledWith(expect.objectContaining({ page: 1 }));

    historyServiceMock.loadAll.mockClear();
    historyServiceMock.currentPage.set(3);
    historyServiceMock.totalPages.set(3);
    component.goNext();
    expect(historyServiceMock.loadAll).not.toHaveBeenCalled();

    historyServiceMock.currentPage.set(2);
    component.goNext();
    expect(historyServiceMock.loadAll).toHaveBeenCalledWith(expect.objectContaining({ page: 3 }));
  });

  it('sets user-friendly error when history load fails', () => {
    const { component, historyServiceMock } = setup();
    component.ngOnInit();

    historyServiceMock.loadAll.mockReturnValueOnce(throwError(() => new Error('network')));

    component.applyFilters();

    expect(component.errorMessage()).toBe('Failed to load movement history.');
  });

  it('formats movement type labels', () => {
    const { component } = setup();

    expect(component.formatMovementType('TRANSFER_IN')).toBe('Transfer In');
    expect(component.formatMovementType('TRANSFER_OUT')).toBe('Transfer Out');
    expect(component.formatMovementType('RECEIVE')).toBe('Receive');
    expect(component.formatMovementType('ADJUSTMENT')).toBe('Adjustment');
    expect(component.formatMovementType('UNKNOWN' as MovementType)).toBe('UNKNOWN');
  });

  it('maps movement type CSS classes', () => {
    const { component } = setup();

    expect(component.movementTypeClass('RECEIVE')).toBe('type-receive');
    expect(component.movementTypeClass('TRANSFER_IN')).toBe('type-transfer');
    expect(component.movementTypeClass('TRANSFER_OUT')).toBe('type-transfer');
    expect(component.movementTypeClass('ADJUSTMENT')).toBe('type-adjustment');
  });

  it('formats positive quantity delta with plus sign', () => {
    const { component } = setup();

    expect(component.signedDelta(7)).toBe('+7');
  });

  it('formats negative quantity delta as negative number', () => {
    const { component } = setup();

    expect(component.signedDelta(-3)).toBe('-3');
  });

  it('formats date-time with expected parts', () => {
    const { component } = setup();

    const result = component.formatDateTime('2026-08-02T10:30:00Z');

    expect(result).toContain('2026');
    expect(result).toMatch(/\d{2}:\d{2}/);
  });

  it('creates movement fixture data helper', () => {
    const movement = createMovement('RECEIVE', 5);

    expect(movement.quantityDelta).toBe(5);
    expect(movement.movementType).toBe('RECEIVE');
  });
});
