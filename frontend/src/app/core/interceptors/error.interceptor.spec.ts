import '@angular/compiler';
import { HttpErrorResponse, HttpRequest } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { throwError } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';
import { AuthService } from '../auth/auth.service';
import { NotificationService } from '../notification/notification.service';
import { errorInterceptor } from './error.interceptor';

describe('errorInterceptor', () => {
  it('401 error — logs out and redirects to /login', () => {
    const authServiceMock = { logout: vi.fn() };
    const routerMock = { navigate: vi.fn(async () => true) };
    const notificationMock = { error: vi.fn() };

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: authServiceMock },
        { provide: Router, useValue: routerMock },
        { provide: NotificationService, useValue: notificationMock },
      ],
    });

    const request = new HttpRequest('GET', '/api/products');
    let capturedStatus = -1;

    TestBed.runInInjectionContext(() =>
      errorInterceptor(request, () => throwError(() => new HttpErrorResponse({ status: 401 }))).subscribe({
        error: (error: HttpErrorResponse) => {
          capturedStatus = error.status;
        },
      })
    );

    expect(capturedStatus).toBe(401);
    expect(authServiceMock.logout).toHaveBeenCalledTimes(1);
    expect(routerMock.navigate).toHaveBeenCalledWith(['/login']);
  });

  it('403 error — dispatches permission notification', () => {
    const authServiceMock = { logout: vi.fn() };
    const routerMock = { navigate: vi.fn(async () => true) };
    const notificationMock = { error: vi.fn() };

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: authServiceMock },
        { provide: Router, useValue: routerMock },
        { provide: NotificationService, useValue: notificationMock },
      ],
    });

    const request = new HttpRequest('GET', '/api/products');

    TestBed.runInInjectionContext(() =>
      errorInterceptor(request, () => throwError(() => new HttpErrorResponse({ status: 403 }))).subscribe({
        error: () => undefined,
      })
    );

    expect(notificationMock.error).toHaveBeenCalledWith('You do not have permission to perform this action.');
    expect(authServiceMock.logout).not.toHaveBeenCalled();
  });
});
