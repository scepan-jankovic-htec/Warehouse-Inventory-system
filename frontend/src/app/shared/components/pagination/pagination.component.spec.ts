import '@angular/compiler';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it, vi } from 'vitest';
import { PaginationComponent } from './pagination.component';

describe('PaginationComponent', () => {
  it('goPrevious — first page — does not emit previous event', () => {
    const fixture = TestBed.configureTestingModule({ imports: [PaginationComponent] }).createComponent(PaginationComponent);
    const component = fixture.componentInstance;

    fixture.componentRef.setInput('page', 1);
    fixture.componentRef.setInput('totalPages', 5);
    fixture.detectChanges();

    const previousSpy = vi.fn();
    component.previous.subscribe(previousSpy);

    component.goPrevious();

    expect(previousSpy).not.toHaveBeenCalled();
  });

  it('goNext — middle page — emits next event', () => {
    const fixture = TestBed.configureTestingModule({ imports: [PaginationComponent] }).createComponent(PaginationComponent);
    const component = fixture.componentInstance;

    fixture.componentRef.setInput('page', 2);
    fixture.componentRef.setInput('totalPages', 5);
    fixture.detectChanges();

    const nextSpy = vi.fn();
    component.next.subscribe(nextSpy);

    component.goNext();

    expect(nextSpy).toHaveBeenCalledTimes(1);
  });
});
