import '@angular/compiler';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { LoginComponent } from './login.component';

describe('LoginComponent', () => {
  it('creates the login page component', () => {
    const fixture = TestBed.configureTestingModule({ imports: [LoginComponent] }).createComponent(LoginComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });
});
