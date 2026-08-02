import '@angular/compiler';
import { HttpRequest, HttpResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { describe, expect, it } from 'vitest';
import { AuthService } from '../auth/auth.service';
import { authInterceptor } from './auth.interceptor';

describe('authInterceptor', () => {
  it('request with token — adds Authorization header', () => {
    localStorage.clear();

    TestBed.configureTestingModule({ providers: [AuthService] });
    const authService = TestBed.inject(AuthService);
    authService.setSession('token-xyz', {
      id: 1,
      username: 'admin',
      fullName: 'Admin User',
      email: 'admin@example.com',
      role: 'ADMIN',
      active: true,
    });

    const request = new HttpRequest('GET', '/api/products');
    const forwardedHeaders: string[] = [];

    TestBed.runInInjectionContext(() =>
      authInterceptor(request, (req) => {
        forwardedHeaders.push(req.headers.get('Authorization') ?? '');
        return of(new HttpResponse({ status: 200 }));
      }).subscribe()
    );

    expect(forwardedHeaders[0]).toBe('Bearer token-xyz');
  });

  it('request without token — leaves Authorization header absent', () => {
    localStorage.clear();

    TestBed.configureTestingModule({ providers: [AuthService] });

    const request = new HttpRequest('GET', '/api/products');
    const forwardedHeaders: string[] = [];

    TestBed.runInInjectionContext(() =>
      authInterceptor(request, (req) => {
        forwardedHeaders.push(req.headers.get('Authorization') ?? '');
        return of(new HttpResponse({ status: 200 }));
      }).subscribe()
    );

    expect(forwardedHeaders[0]).toBe('');
  });
});
