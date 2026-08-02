import '@angular/compiler';
import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';
import { HistoryListComponent } from './history-list.component';
import { HistoryService } from '../../services/history.service';

function createComponent(): HistoryListComponent {
  const historyServiceMock = {
    history: signal([]),
    isLoading: signal(false),
    totalElements: signal(0),
    totalPages: signal(1),
    currentPage: signal(1),
    loadAll: vi.fn(() => of({ data: [], pagination: { page: 1, size: 20, totalElements: 0, totalPages: 0 } })),
    getProductOptions: vi.fn(() => of({ data: [], pagination: { page: 1, size: 20, totalElements: 0, totalPages: 0 } })),
    getLocationOptions: vi.fn(() => of({ data: [], pagination: { page: 1, size: 20, totalElements: 0, totalPages: 0 } })),
  };

  TestBed.configureTestingModule({
    imports: [HistoryListComponent],
    providers: [{ provide: HistoryService, useValue: historyServiceMock }],
  });

  return TestBed.createComponent(HistoryListComponent).componentInstance;
}

describe('HistoryListComponent', () => {
  it('formats positive quantity delta with plus sign', () => {
    const component = createComponent();

    expect(component.signedDelta(7)).toBe('+7');
  });

  it('formats negative quantity delta as negative number', () => {
    const component = createComponent();

    expect(component.signedDelta(-3)).toBe('-3');
  });
});
