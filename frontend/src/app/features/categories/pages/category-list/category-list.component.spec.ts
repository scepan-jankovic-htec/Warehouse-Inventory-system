import '@angular/compiler';
import { signal } from '@angular/core';
import { of, throwError } from 'rxjs';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Router } from '@angular/router';
import { CategoryService } from '../../services/category.service';
import { CategoryListComponent } from './category-list.component';

describe('CategoryListComponent', () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  function createComponent(options?: {
    loadShouldFail?: boolean;
    deactivateShouldFail?: boolean;
    activateShouldFail?: boolean;
    totalElements?: number;
  }) {
    const loadCategories = options?.loadShouldFail
      ? vi.fn(() => throwError(() => new Error('load failed')))
      : vi.fn(() => of({ data: [], pagination: { page: 1, size: 10, totalElements: 0, totalPages: 0 } }));

    const deactivateCategory = options?.deactivateShouldFail
      ? vi.fn(() => throwError(() => new Error('deactivate failed')))
      : vi.fn(() => of(void 0));

    const activateCategory = options?.activateShouldFail
      ? vi.fn(() => throwError(() => new Error('activate failed')))
      : vi.fn(() => of(void 0));

    const categoryServiceMock = {
      categories: signal([
        { id: 1, name: 'Electronics', description: 'Devices', active: true, productCount: 3, createdAt: '2026-08-01T00:00:00Z', updatedAt: '2026-08-01T00:00:00Z' },
        { id: 2, name: 'Stationery', description: null, active: false, productCount: 1, createdAt: '2026-08-02T00:00:00Z', updatedAt: '2026-08-02T00:00:00Z' },
      ]),
      isLoading: signal(false),
      totalElements: signal(options?.totalElements ?? 2),
      loadCategories,
      deactivateCategory,
      activateCategory,
    };
    const routerMock = { navigate: vi.fn() };

    const component = new CategoryListComponent(categoryServiceMock as never, routerMock as never);
    return { component, routerMock, categoryServiceMock };
  }

  it('ngOnInit — loads categories and keeps default error state', () => {
    const { categoryServiceMock, component } = createComponent();

    component.ngOnInit();

    expect(categoryServiceMock.loadCategories).toHaveBeenCalledWith({
      page: 1,
      size: 100,
      active: undefined,
      sortBy: 'name',
      sortDir: 'asc',
    });
    expect(component.errorMessage()).toBe('');
  });

  it('ngOnInit — load failure — sets error message', () => {
    const { component } = createComponent({ loadShouldFail: true });

    component.ngOnInit();

    expect(component.errorMessage()).toBe('Failed to load categories');
  });

  it('filteredCategories — active filter and search — returns matching categories', () => {
    const { component } = createComponent();

    component.searchQuery.set('elect');
    component.activeOnly.set(true);

    expect(component.filteredCategories().length).toBe(1);
  });

  it('filteredCategories — sort by createdAt descending — orders newest first', () => {
    const { component } = createComponent();

    component.toggleSort('createdAt');
    component.toggleSort('createdAt');

    expect(component.filteredCategories()[0].name).toBe('Stationery');
  });

  it('paginatedCategories and totalPages — respect page size and current page', () => {
    const { component } = createComponent();

    component.pageSize.set(1);
    component.currentPage.set(2);

    expect(component.totalPages()).toBe(2);
    expect(component.paginatedCategories()[0].name).toBe('Stationery');
  });

  it('toggleSort — same field — flips sort direction', () => {
    const { component } = createComponent();

    component.toggleSort('name');
    expect(component.sortDir()).toBe('desc');
  });

  it('toggleSort — different field — switches field and resets direction', () => {
    const { component } = createComponent();

    component.toggleSort('createdAt');

    expect(component.sortBy()).toBe('createdAt');
    expect(component.sortDir()).toBe('asc');
  });

  it('getSortIndicator — shows indicator only for active field', () => {
    const { component } = createComponent();

    expect(component.getSortIndicator('createdAt')).toBe('');
    expect(component.getSortIndicator('name')).toBe('↑');

    component.toggleSort('name');

    expect(component.getSortIndicator('name')).toBe('↓');
  });

  it('onSearchChange and toggleActiveFilter — reset to first page', () => {
    vi.useFakeTimers();
    try {
      const { component } = createComponent();

      component.ngOnInit();
      component.currentPage.set(3);
      component.onSearchChange({ target: { value: 'stat' } } as unknown as Event);
      vi.advanceTimersByTime(300);

      expect(component.searchQuery()).toBe('stat');
      expect(component.currentPage()).toBe(1);

      component.currentPage.set(4);
      component.toggleActiveFilter();

      expect(component.activeOnly()).toBe(true);
      expect(component.currentPage()).toBe(1);
    } finally {
      vi.useRealTimers();
    }
  });

  it('previousPage and nextPage — stay within bounds', () => {
    const { component } = createComponent();

    component.previousPage();
    expect(component.currentPage()).toBe(1);

    component.pageSize.set(1);
    component.nextPage();
    expect(component.currentPage()).toBe(2);

    component.nextPage();
    expect(component.currentPage()).toBe(2);
  });

  it('createNew and editCategory — navigation routes', () => {
    const { component, routerMock } = createComponent();

    component.createNew();
    component.editCategory({ id: 2 } as never);

    expect(routerMock.navigate).toHaveBeenNthCalledWith(1, ['/categories/new']);
    expect(routerMock.navigate).toHaveBeenNthCalledWith(2, ['/categories', 2, 'edit']);
  });

  it('toggleActive — deactivate path — clears errors on success', () => {
    const { component, categoryServiceMock } = createComponent();

    component.errorMessage.set('previous error');
    component.toggleActive({ id: 1, active: true } as never);

    expect(categoryServiceMock.deactivateCategory).toHaveBeenCalledWith(1);
    expect(component.errorMessage()).toBe('');
  });

  it('toggleActive — activate path and failure path — sets error message', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const { component, categoryServiceMock } = createComponent({ activateShouldFail: true });

    component.toggleActive({ id: 2, active: false } as never);

    expect(categoryServiceMock.activateCategory).toHaveBeenCalledWith(2);
    expect(component.errorMessage()).toBe('Failed to activate category');
    expect(consoleSpy).toHaveBeenCalled();

    consoleSpy.mockRestore();
  });

  it('formatDate — formats dates in the expected locale style', () => {
    const { component } = createComponent();

    expect(component.formatDate('2026-08-02T00:00:00Z')).toBe('Aug 2, 2026');
  });
});
