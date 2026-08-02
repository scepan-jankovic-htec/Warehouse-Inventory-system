import '@angular/compiler';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router, UrlTree } from '@angular/router';
import { describe, expect, it } from 'vitest';
import { AuthService } from './auth.service';
import { roleGuard } from './role.guard';

describe('roleGuard', () => {
  it('ADMIN user — allows navigation', () => {
    localStorage.clear();

    TestBed.configureTestingModule({
      providers: [AuthService, provideRouter([])],
    });

    const authService = TestBed.inject(AuthService);
    authService.setSession('token-1', {
      id: 1,
      username: 'admin',
      fullName: 'Admin User',
      email: 'admin@example.com',
      role: 'ADMIN',
      active: true,
    });

    const result = TestBed.runInInjectionContext(() => roleGuard({} as never, {} as never));
    expect(result).toBe(true);
  });

  it('non-ADMIN user — redirects to /dashboard', () => {
    localStorage.clear();

    TestBed.configureTestingModule({
      providers: [AuthService, provideRouter([])],
    });

    const authService = TestBed.inject(AuthService);
    authService.setSession('token-2', {
      id: 2,
      username: 'operator',
      fullName: 'Store Operator',
      email: 'operator@example.com',
      role: 'STORE_OPERATOR',
      active: true,
    });

    const router = TestBed.inject(Router);
    const result = TestBed.runInInjectionContext(() => roleGuard({} as never, {} as never));

    expect(result).not.toBe(true);
    expect(router.serializeUrl(result as UrlTree)).toBe('/dashboard');
  });
});
