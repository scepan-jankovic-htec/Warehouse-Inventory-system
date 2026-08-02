import '@angular/compiler';
import { Injector, runInInjectionContext } from '@angular/core';
import { beforeEach, describe, expect, it } from 'vitest';
import { StatusBadgeComponent } from './status-badge.component';

describe('StatusBadgeComponent', () => {
  let component: StatusBadgeComponent;

  function setInputs(value: string, label = 'Active'): void {
    (component as unknown as { value: () => string }).value = () => value;
    (component as unknown as { label: () => string }).label = () => label;
  }

  beforeEach(() => {
    const injector = Injector.create({ providers: [] });
    component = runInInjectionContext(injector, () => new StatusBadgeComponent());
    setInputs('ACTIVE', 'Active');
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should expose provided label signal', () => {
    expect((component as { label: () => string }).label()).toBe('Active');
  });

  it('should map ACTIVE to active class', () => {
    setInputs('ACTIVE');

    expect(component.badgeClass()).toBe('active');
  });

  it('should map INACTIVE to inactive class', () => {
    setInputs('INACTIVE');

    expect(component.badgeClass()).toBe('inactive');
  });

  it('should map IN_STOCK to in-stock class', () => {
    setInputs('IN_STOCK');

    expect(component.badgeClass()).toBe('in-stock');
  });

  it('should map LOW_STOCK to low-stock class', () => {
    setInputs('LOW_STOCK');

    expect(component.badgeClass()).toBe('low-stock');
  });

  it('should map OUT_OF_STOCK to out-of-stock class', () => {
    setInputs('OUT_OF_STOCK');

    expect(component.badgeClass()).toBe('out-of-stock');
  });

  it('should be case-insensitive when mapping status', () => {
    setInputs('inactive');

    expect(component.badgeClass()).toBe('inactive');
  });

  it('should return empty class for unknown status', () => {
    setInputs('UNKNOWN_STATUS');

    expect(component.badgeClass()).toBe('');
  });
});
