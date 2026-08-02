import '@angular/compiler';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { LoadingSpinnerComponent } from './loading-spinner.component';

describe('LoadingSpinnerComponent', () => {
  it('renders custom message input', () => {
    const fixture = TestBed.configureTestingModule({ imports: [LoadingSpinnerComponent] }).createComponent(LoadingSpinnerComponent);

    fixture.componentRef.setInput('message', 'Loading inventory...');
    fixture.detectChanges();

    const html = fixture.nativeElement as HTMLElement;
    expect(html.textContent).toContain('Loading inventory...');
  });

  it('applies compact class when compact input is true', () => {
    const fixture = TestBed.configureTestingModule({ imports: [LoadingSpinnerComponent] }).createComponent(LoadingSpinnerComponent);

    fixture.componentRef.setInput('compact', true);
    fixture.detectChanges();

    const wrapper = fixture.nativeElement.querySelector('.loading-wrapper') as HTMLElement;
    expect(wrapper.classList.contains('compact')).toBe(true);
  });
});
