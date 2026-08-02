import '@angular/compiler';
import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';
import { Router } from '@angular/router';
import { CategoryService } from '../../services/category.service';
import { CategoryListComponent } from './category-list.component';

describe('CategoryListComponent', () => {
  function createComponent() {
    const categoryServiceMock = {
      categories: signal([
        { id: 1, name: 'Electronics', description: 'Devices', active: true, productCount: 3, createdAt: '2026-08-01T00:00:00Z', updatedAt: '2026-08-01T00:00:00Z' },
        { id: 2, name: 'Stationery', description: null, active: false, productCount: 1, createdAt: '2026-08-02T00:00:00Z', updatedAt: '2026-08-02T00:00:00Z' },
      ]),
      isLoading: signal(false),
      totalElements: signal(2),
      loadCategories: vi.fn(() => of({ data: [], pagination: { page: 1, size: 10, totalElements: 0, totalPages: 0 } })),
      deactivateCategory: vi.fn(() => of(void 0)),
      activateCategory: vi.fn(() => of(void 0)),
    };
    const routerMock = { navigate: vi.fn() };

    TestBed.configureTestingModule({
      imports: [CategoryListComponent],
      providers: [
        { provide: CategoryService, useValue: categoryServiceMock },
        { provide: Router, useValue: routerMock },
      ],
    });

    const fixture = TestBed.createComponent(CategoryListComponent);
    return { fixture, component: fixture.componentInstance, routerMock, categoryServiceMock };
  }

  it('filteredCategories — active filter and search — returns matching categories', () => {
    const { component } = createComponent();

    component.searchQuery.set('elect');
    component.activeOnly.set(true);

    expect(component.filteredCategories().length).toBe(1);
  });

  it('toggleSort — same field — flips sort direction', () => {
    const { component } = createComponent();

    component.toggleSort('name');
    expect(component.sortDir()).toBe('desc');
  });

  it('createNew and editCategory — navigation routes', () => {
    const { component, routerMock } = createComponent();

    component.createNew();
    component.editCategory({ id: 2 } as never);

    expect(routerMock.navigate).toHaveBeenNthCalledWith(1, ['/categories/new']);
    expect(routerMock.navigate).toHaveBeenNthCalledWith(2, ['/categories', 2, 'edit']);
  });
});
