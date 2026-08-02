import '@angular/compiler';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router, UrlTree } from '@angular/router';
import { describe, expect, it } from 'vitest';
import { AuthService } from './auth.service';
import { authGuard } from './auth.guard';

describe('authGuard', () => {
  it('unauthenticated user — redirects to /login', () => {
    localStorage.clear();

    TestBed.configureTestingModule({
      providers: [AuthService, provideRouter([])],
    });

    const router = TestBed.inject(Router);
    const result = TestBed.runInInjectionContext(() => authGuard({} as never, {} as never));

    expect(result).not.toBe(true);
    expect(router.serializeUrl(result as UrlTree)).toBe('/login');
  });

  it('authenticated user — allows navigation', () => {
    localStorage.clear();

    TestBed.configureTestingModule({
      providers: [AuthService, provideRouter([])],
    });

    const authService = TestBed.inject(AuthService);
    authService.setSession('token-123', {
      id: 1,
      username: 'admin',
      fullName: 'Admin User',
      email: 'admin@example.com',
      role: 'ADMIN',
      active: true,
    });

    const result = TestBed.runInInjectionContext(() => authGuard({} as never, {} as never));
    expect(result).toBe(true);
  });
});
