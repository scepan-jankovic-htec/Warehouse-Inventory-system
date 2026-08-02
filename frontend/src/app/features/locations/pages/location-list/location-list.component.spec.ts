import '@angular/compiler';
import { Injector, runInInjectionContext, signal } from '@angular/core';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { LocationService } from '../../services/location.service';
import { LocationListComponent } from './location-list.component';

describe('LocationListComponent', () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  function createComponent(options?: { loadLocationsShouldFail?: boolean; totalPages?: number }) {
    const loadLocationsImpl = options?.loadLocationsShouldFail
      ? vi.fn(() => throwError(() => new Error('load failed')))
      : vi.fn(() => of({ data: [], pagination: { page: 1, size: 20, totalElements: 0, totalPages: 0 } }));

    const locationServiceMock = {
      locations: signal([
        {
          id: 1,
          name: 'Central Warehouse',
          type: 'WAREHOUSE' as const,
          address: '100 Depot Way',
          active: true,
          createdAt: '2026-08-01T00:00:00Z',
          updatedAt: '2026-08-01T00:00:00Z',
        },
        {
          id: 2,
          name: 'Downtown Store',
          type: 'STORE' as const,
          address: null,
          active: false,
          createdAt: '2026-08-02T00:00:00Z',
          updatedAt: '2026-08-02T00:00:00Z',
        },
      ]),
      isLoading: signal(false),
      totalElements: signal(2),
      totalPages: signal(options?.totalPages ?? 1),
      loadLocations: loadLocationsImpl,
      deactivateLocation: vi.fn(() => of(void 0)),
      activateLocation: vi.fn(() => of(void 0)),
    };

    const routerMock = { navigate: vi.fn() };

    const injector = Injector.create({
      providers: [
        { provide: LocationService, useValue: locationServiceMock },
        { provide: Router, useValue: routerMock },
      ],
    });

    const component = runInInjectionContext(injector, () => new LocationListComponent());
    return { component, routerMock, locationServiceMock };
  }

  it('ngOnInit — loads locations with default query', () => {
    const { component, locationServiceMock } = createComponent();

    component.ngOnInit();

    expect(locationServiceMock.loadLocations).toHaveBeenCalledWith({
      search: undefined,
      type: undefined,
      active: undefined,
      sortBy: 'name',
      sortDir: 'asc',
      page: 1,
      size: 20,
    });
  });

  it('ngOnInit — load failure sets error message', () => {
    const { component } = createComponent({ loadLocationsShouldFail: true });

    component.ngOnInit();

    expect(component.errorMessage()).toBe('Failed to load locations.');
  });

  it('onSearchInput — updates search, debounces reload and resets page', () => {
    vi.useFakeTimers();
    const { component, locationServiceMock } = createComponent();

    component.ngOnInit();
    component.currentPage.set(4);
    locationServiceMock.loadLocations.mockClear();

    component.onSearchInput({ target: { value: '  central  ' } } as unknown as Event);

    expect(component.search()).toBe('  central  ');
    expect(locationServiceMock.loadLocations).not.toHaveBeenCalled();

    vi.advanceTimersByTime(300);

    expect(component.currentPage()).toBe(1);
    expect(locationServiceMock.loadLocations).toHaveBeenCalledWith({
      search: 'central',
      type: undefined,
      active: undefined,
      sortBy: 'name',
      sortDir: 'asc',
      page: 1,
      size: 20,
    });
  });

  it('onTypeChange and onActiveToggle — update filters, reset page and reload', () => {
    const { component, locationServiceMock } = createComponent();

    component.currentPage.set(3);
    component.onTypeChange({ target: { value: 'STORE' } } as unknown as Event);

    expect(component.typeFilter()).toBe('STORE');
    expect(component.currentPage()).toBe(1);
    expect(locationServiceMock.loadLocations).toHaveBeenLastCalledWith(
      expect.objectContaining({ type: 'STORE', page: 1, active: undefined })
    );

    component.currentPage.set(2);
    component.onActiveToggle();

    expect(component.activeOnly()).toBe(true);
    expect(component.currentPage()).toBe(1);
    expect(locationServiceMock.loadLocations).toHaveBeenLastCalledWith(
      expect.objectContaining({ type: 'STORE', active: true, page: 1 })
    );
  });

  it('onSort and sortMarker — toggle same field, reset new field and expose markers', () => {
    const { component, locationServiceMock } = createComponent();

    expect(component.sortMarker('type')).toBe('');
    expect(component.sortMarker('name')).toBe('↑');

    component.onSort('name');
    expect(component.sortBy()).toBe('name');
    expect(component.sortDir()).toBe('desc');
    expect(component.sortMarker('name')).toBe('↓');
    expect(locationServiceMock.loadLocations).toHaveBeenLastCalledWith(
      expect.objectContaining({ sortBy: 'name', sortDir: 'desc' })
    );

    component.onSort('type');
    expect(component.sortBy()).toBe('type');
    expect(component.sortDir()).toBe('asc');
    expect(locationServiceMock.loadLocations).toHaveBeenLastCalledWith(
      expect.objectContaining({ sortBy: 'type', sortDir: 'asc' })
    );
  });

  it('goPrevious and goNext — respect pagination boundaries and reload when page changes', () => {
    const { component, locationServiceMock } = createComponent({ totalPages: 3 });

    component.currentPage.set(1);
    component.goPrevious();
    expect(component.currentPage()).toBe(1);

    component.goNext();
    expect(component.currentPage()).toBe(2);

    component.goPrevious();
    expect(component.currentPage()).toBe(1);

    component.currentPage.set(3);
    component.goNext();
    expect(component.currentPage()).toBe(3);

    expect(locationServiceMock.loadLocations).toHaveBeenCalledTimes(2);
  });

  it('createNew and edit — navigate to expected routes', () => {
    const { component, routerMock } = createComponent();

    component.createNew();
    component.edit({
      id: 2,
      name: 'Downtown Store',
      type: 'STORE',
      address: null,
      active: false,
      createdAt: '2026-08-02T00:00:00Z',
      updatedAt: '2026-08-02T00:00:00Z',
    });

    expect(routerMock.navigate).toHaveBeenNthCalledWith(1, ['/locations/new']);
    expect(routerMock.navigate).toHaveBeenNthCalledWith(2, ['/locations', 2, 'edit']);
  });

  it('toggleActive — active location deactivates and clears previous error on success', () => {
    const { component, locationServiceMock } = createComponent();

    component.errorMessage.set('Previous error');
    component.toggleActive({
      id: 1,
      name: 'Central Warehouse',
      type: 'WAREHOUSE',
      address: '100 Depot Way',
      active: true,
      createdAt: '2026-08-01T00:00:00Z',
      updatedAt: '2026-08-01T00:00:00Z',
    });

    expect(locationServiceMock.deactivateLocation).toHaveBeenCalledWith(1);
    expect(component.errorMessage()).toBe('');
  });

  it('toggleActive — inactive location activation failure sets error message', () => {
    const { component, locationServiceMock } = createComponent();
    locationServiceMock.activateLocation.mockReturnValueOnce(throwError(() => new Error('boom')));

    component.toggleActive({
      id: 2,
      name: 'Downtown Store',
      type: 'STORE',
      address: null,
      active: false,
      createdAt: '2026-08-02T00:00:00Z',
      updatedAt: '2026-08-02T00:00:00Z',
    });

    expect(locationServiceMock.activateLocation).toHaveBeenCalledWith(2);
    expect(component.errorMessage()).toBe('Failed to activate location.');
  });
});
