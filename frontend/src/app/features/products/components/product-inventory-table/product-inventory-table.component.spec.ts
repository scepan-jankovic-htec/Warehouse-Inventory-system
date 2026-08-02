import '@angular/compiler';
import { Injector, runInInjectionContext } from '@angular/core';
import { describe, expect, it } from 'vitest';
import { ProductInventoryTableComponent } from './product-inventory-table.component';

function createComponent(): ProductInventoryTableComponent {
  const injector = Injector.create({ providers: [] });
  return runInInjectionContext(injector, () => new ProductInventoryTableComponent());
}

describe('ProductInventoryTableComponent', () => {
  it('inventory input signal defaults to empty array', () => {
    const component = createComponent();

    expect(component.inventory()).toEqual([]);
  });

  it('formatStatus — IN_STOCK — returns human-friendly label', () => {
    const component = createComponent();

    expect(component.formatStatus('IN_STOCK')).toBe('In stock');
  });

  it('formatStatus — LOW_STOCK — returns human-friendly label', () => {
    const component = createComponent();

    expect(component.formatStatus('LOW_STOCK')).toBe('Low stock');
  });

  it('formatStatus — OUT_OF_STOCK — returns human-friendly label', () => {
    const component = createComponent();

    expect(component.formatStatus('OUT_OF_STOCK')).toBe('Out of stock');
  });

  it('formatStatus — unsupported value — returns original status', () => {
    const component = createComponent();

    expect(component.formatStatus('UNKNOWN_STATUS')).toBe('UNKNOWN_STATUS');
  });
});
