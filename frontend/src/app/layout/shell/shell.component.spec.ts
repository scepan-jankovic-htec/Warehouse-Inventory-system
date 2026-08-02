import '@angular/compiler';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { describe, expect, it } from 'vitest';
import { ShellComponent } from './shell.component';

describe('ShellComponent', () => {
  it('renders topbar, sidebar, and router outlet host', () => {
    const fixture = TestBed.configureTestingModule({
      imports: [ShellComponent],
      providers: [provideRouter([])],
    }).createComponent(ShellComponent);
    fixture.detectChanges();

    const html = fixture.nativeElement as HTMLElement;
    expect(html.querySelector('app-topbar')).not.toBeNull();
    expect(html.querySelector('app-sidebar')).not.toBeNull();
    expect(html.querySelector('router-outlet')).not.toBeNull();
  });
});
