import '@angular/compiler';
import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';
import { CategoryService } from '../../../categories/services/category.service';
import { ProductService } from '../../services/product.service';
import { ProductListComponent } from './product-list.component';
import { Router } from '@angular/router';

describe('ProductListComponent', () => {
  function createComponent() {
    const productServiceMock = {
      products: signal([
        {
          id: 1,
          sku: 'BAT-AA-4P',
          name: 'AA Battery 4-Pack',
          description: null,
          category: { id: 1, name: 'Electronics' },
          unitOfMeasure: 'PACK',
          reorderThreshold: 50,
          active: true,
          createdAt: '2026-08-01T00:00:00Z',
          updatedAt: '2026-08-01T00:00:00Z',
        },
      ]),
      isLoading: signal(false),
      totalElements: signal(1),
      totalPages: signal(1),
      loadProducts: vi.fn(() => of({ data: [], pagination: { page: 1, size: 20, totalElements: 0, totalPages: 0 } })),
      deactivateProduct: vi.fn(() => of(void 0)),
      activateProduct: vi.fn(() => of(void 0)),
    };

    const categoryServiceMock = {
      categories: signal([{ id: 1, name: 'Electronics' }]),
      loadCategories: vi.fn(() => of({ data: [], pagination: { page: 1, size: 20, totalElements: 0, totalPages: 0 } })),
    };

    const routerMock = { navigate: vi.fn() };

    TestBed.configureTestingModule({
      imports: [ProductListComponent],
      providers: [
        { provide: ProductService, useValue: productServiceMock },
        { provide: CategoryService, useValue: categoryServiceMock },
        { provide: Router, useValue: routerMock },
      ],
    });

    const fixture = TestBed.createComponent(ProductListComponent);
    return { fixture, component: fixture.componentInstance, routerMock, productServiceMock, categoryServiceMock };
  }

  it('ngOnInit — loads categories and products', () => {
    const { fixture, productServiceMock, categoryServiceMock } = createComponent();

    fixture.componentInstance.ngOnInit();

    expect(categoryServiceMock.loadCategories).toHaveBeenCalled();
    expect(productServiceMock.loadProducts).toHaveBeenCalled();
  });

  it('goToDetail and goToEdit — routes to detail pages', () => {
    const { component, routerMock } = createComponent();

    component.goToDetail(7);
    component.goToEdit(7);

    expect(routerMock.navigate).toHaveBeenNthCalledWith(1, ['/products', 7]);
    expect(routerMock.navigate).toHaveBeenNthCalledWith(2, ['/products', 7, 'edit']);
  });

  it('sortMarker — active sort field — returns arrow', () => {
    const { component } = createComponent();

    expect(component.sortMarker('name')).toBe('↑');
  });
});
