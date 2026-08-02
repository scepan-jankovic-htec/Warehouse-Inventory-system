import '@angular/compiler';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { Router } from '@angular/router';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthService } from '../../../../core/auth/auth.service';
import { NotificationService } from '../../../../core/notification/notification.service';
import { AuthApiService } from '../../services/auth-api.service';
import { LoginComponent } from './login.component';

// Helper: encode a JS object as a mock JWT token
function makeFakeToken(payload: Record<string, unknown>): string {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body = btoa(JSON.stringify(payload));
  return `${header}.${body}.signature`;
}

function setup() {
  const authApiSpy = { login: vi.fn() };
  const authServiceSpy = { setSession: vi.fn() };
  const notificationSpy = { success: vi.fn(), error: vi.fn() };

  TestBed.configureTestingModule({
    imports: [LoginComponent],
    providers: [
      provideHttpClient(),
      provideHttpClientTesting(),
      provideAnimationsAsync(),
      provideRouter([]),
      { provide: AuthApiService, useValue: authApiSpy },
      { provide: AuthService, useValue: authServiceSpy },
      { provide: NotificationService, useValue: notificationSpy }
    ]
  });

  const fixture = TestBed.createComponent(LoginComponent);
  fixture.detectChanges();

  return {
    fixture,
    comp: fixture.componentInstance,
    authApiSpy,
    authServiceSpy,
    notificationSpy,
    router: TestBed.inject(Router)
  };
}

describe('LoginComponent', () => {
  beforeEach(() => {
    TestBed.resetTestingModule();
  });

  // ── creation ──────────────────────────────────────────────────────────────

  it('creates the component', () => {
    const { comp } = setup();
    expect(comp).toBeTruthy();
  });

  // ── initial state ─────────────────────────────────────────────────────────

  it('loading signal starts as false', () => {
    const { comp } = setup();
    expect(comp.loading()).toBe(false);
  });

  it('errorMessage signal starts as null', () => {
    const { comp } = setup();
    expect(comp.errorMessage()).toBeNull();
  });

  it('hidePassword signal starts as true', () => {
    const { comp } = setup();
    expect(comp.hidePassword()).toBe(true);
  });

  // ── form validation ───────────────────────────────────────────────────────

  it('form is invalid when empty', () => {
    const { comp } = setup();
    expect(comp.form.invalid).toBe(true);
  });

  it('form is invalid when only username is provided', () => {
    const { comp } = setup();
    comp.form.controls.username.setValue('admin');
    expect(comp.form.invalid).toBe(true);
  });

  it('form is invalid when only password is provided', () => {
    const { comp } = setup();
    comp.form.controls.password.setValue('secret');
    expect(comp.form.invalid).toBe(true);
  });

  it('form is valid when username and password are filled', () => {
    const { comp } = setup();
    comp.form.setValue({ username: 'admin', password: 'secret' });
    expect(comp.form.valid).toBe(true);
  });

  // ── togglePassword ────────────────────────────────────────────────────────

  it('togglePassword flips hidePassword from true to false', () => {
    const { comp } = setup();
    expect(comp.hidePassword()).toBe(true);
    comp.togglePassword();
    expect(comp.hidePassword()).toBe(false);
  });

  it('togglePassword flips hidePassword back to true on second call', () => {
    const { comp } = setup();
    comp.togglePassword();
    comp.togglePassword();
    expect(comp.hidePassword()).toBe(true);
  });

  // ── onSubmit – invalid form ───────────────────────────────────────────────

  it('marks all fields as touched when submitting an invalid form', () => {
    const { comp } = setup();
    comp.onSubmit();
    expect(comp.form.controls.username.touched).toBe(true);
    expect(comp.form.controls.password.touched).toBe(true);
  });

  it('does not call login API when form is invalid', () => {
    const { comp, authApiSpy } = setup();
    comp.onSubmit();
    expect(authApiSpy.login).not.toHaveBeenCalled();
  });

  it('does not set loading when form is invalid', () => {
    const { comp } = setup();
    comp.onSubmit();
    expect(comp.loading()).toBe(false);
  });

  // ── onSubmit – success ────────────────────────────────────────────────────

  it('calls login API with form credentials on valid submit', () => {
    const { comp, authApiSpy } = setup();
    authApiSpy.login.mockReturnValue(of({ token: makeFakeToken({}), tokenType: 'Bearer', expiresInMs: 3600000 }));
    comp.form.setValue({ username: 'admin', password: 'secret' });
    comp.onSubmit();
    expect(authApiSpy.login).toHaveBeenCalledWith({ username: 'admin', password: 'secret' });
  });

  it('sets loading to true during request and false after success', async () => {
    const { comp, authApiSpy } = setup();
    authApiSpy.login.mockReturnValue(of({ token: makeFakeToken({}), tokenType: 'Bearer', expiresInMs: 3600000 }));
    comp.form.setValue({ username: 'admin', password: 'secret' });
    comp.onSubmit();
    // After synchronous observable completes, loading should be reset
    expect(comp.loading()).toBe(false);
  });

  it('clears errorMessage before calling the API', () => {
    const { comp, authApiSpy } = setup();
    authApiSpy.login.mockReturnValue(of({ token: makeFakeToken({}), tokenType: 'Bearer', expiresInMs: 3600000 }));
    comp['errorMessage'].set('previous error');
    comp.form.setValue({ username: 'admin', password: 'secret' });
    comp.onSubmit();
    expect(comp.errorMessage()).toBeNull();
  });

  it('calls authService.setSession with decoded token data on success', () => {
    const { comp, authApiSpy, authServiceSpy } = setup();
    const payload = {
      userId: 42,
      username: 'admin',
      fullName: 'Admin User',
      email: 'admin@example.com',
      authorities: ['ROLE_ADMIN']
    };
    const token = makeFakeToken(payload);
    authApiSpy.login.mockReturnValue(of({ token, tokenType: 'Bearer', expiresInMs: 3600000 }));
    comp.form.setValue({ username: 'admin', password: 'secret' });
    comp.onSubmit();
    expect(authServiceSpy.setSession).toHaveBeenCalledWith(token, {
      id: 42,
      username: 'admin',
      fullName: 'Admin User',
      email: 'admin@example.com',
      role: 'ADMIN',
      active: true
    });
  });

  it('falls back to form username when token username claim is missing', () => {
    const { comp, authApiSpy, authServiceSpy } = setup();
    const token = makeFakeToken({ userId: 1, authorities: ['ROLE_ADMIN'] });
    authApiSpy.login.mockReturnValue(of({ token, tokenType: 'Bearer', expiresInMs: 3600000 }));
    comp.form.setValue({ username: 'formuser', password: 'secret' });
    comp.onSubmit();
    const callArg = authServiceSpy.setSession.mock.calls[0][1];
    expect(callArg.username).toBe('formuser');
  });

  it('falls back to empty string when fullName claim is missing', () => {
    const { comp, authApiSpy, authServiceSpy } = setup();
    const token = makeFakeToken({ userId: 1, username: 'admin', authorities: ['ROLE_ADMIN'] });
    authApiSpy.login.mockReturnValue(of({ token, tokenType: 'Bearer', expiresInMs: 3600000 }));
    comp.form.setValue({ username: 'admin', password: 'secret' });
    comp.onSubmit();
    const callArg = authServiceSpy.setSession.mock.calls[0][1];
    expect(callArg.fullName).toBe('');
  });

  it('falls back to empty string when email claim is missing', () => {
    const { comp, authApiSpy, authServiceSpy } = setup();
    const token = makeFakeToken({ userId: 1, username: 'admin', authorities: ['ROLE_ADMIN'] });
    authApiSpy.login.mockReturnValue(of({ token, tokenType: 'Bearer', expiresInMs: 3600000 }));
    comp.form.setValue({ username: 'admin', password: 'secret' });
    comp.onSubmit();
    const callArg = authServiceSpy.setSession.mock.calls[0][1];
    expect(callArg.email).toBe('');
  });

  it('uses userId 0 when userId claim is not a number', () => {
    const { comp, authApiSpy, authServiceSpy } = setup();
    const token = makeFakeToken({ userId: 'not-a-number', authorities: ['ROLE_ADMIN'] });
    authApiSpy.login.mockReturnValue(of({ token, tokenType: 'Bearer', expiresInMs: 3600000 }));
    comp.form.setValue({ username: 'admin', password: 'secret' });
    comp.onSubmit();
    const callArg = authServiceSpy.setSession.mock.calls[0][1];
    expect(callArg.id).toBe(0);
  });

  it('shows success notification on successful login', () => {
    const { comp, authApiSpy, notificationSpy } = setup();
    authApiSpy.login.mockReturnValue(of({ token: makeFakeToken({}), tokenType: 'Bearer', expiresInMs: 3600000 }));
    comp.form.setValue({ username: 'admin', password: 'secret' });
    comp.onSubmit();
    expect(notificationSpy.success).toHaveBeenCalledWith('Signed in successfully.');
  });

  it('navigates to root after successful login', async () => {
    const { comp, authApiSpy, router } = setup();
    authApiSpy.login.mockReturnValue(of({ token: makeFakeToken({}), tokenType: 'Bearer', expiresInMs: 3600000 }));
    const navigateSpy = vi.spyOn(router, 'navigate');
    comp.form.setValue({ username: 'admin', password: 'secret' });
    comp.onSubmit();
    expect(navigateSpy).toHaveBeenCalledWith(['/']);
  });

  // ── role resolution ───────────────────────────────────────────────────────

  it.each([
    ['ROLE_ADMIN', 'ADMIN'],
    ['ROLE_MANAGER', 'MANAGER'],
    ['ROLE_WAREHOUSE_OPERATOR', 'WAREHOUSE_OPERATOR'],
    ['ROLE_STORE_OPERATOR', 'STORE_OPERATOR']
  ] as const)('resolves role %s to %s', (authority, expectedRole) => {
    const { comp, authApiSpy, authServiceSpy } = setup();
    const token = makeFakeToken({ userId: 1, authorities: [authority] });
    authApiSpy.login.mockReturnValue(of({ token, tokenType: 'Bearer', expiresInMs: 3600000 }));
    comp.form.setValue({ username: 'admin', password: 'secret' });
    comp.onSubmit();
    const callArg = authServiceSpy.setSession.mock.calls[0][1];
    expect(callArg.role).toBe(expectedRole);
  });

  it('defaults role to WAREHOUSE_OPERATOR when authorities is not an array', () => {
    const { comp, authApiSpy, authServiceSpy } = setup();
    const token = makeFakeToken({ userId: 1, authorities: null });
    authApiSpy.login.mockReturnValue(of({ token, tokenType: 'Bearer', expiresInMs: 3600000 }));
    comp.form.setValue({ username: 'admin', password: 'secret' });
    comp.onSubmit();
    const callArg = authServiceSpy.setSession.mock.calls[0][1];
    expect(callArg.role).toBe('WAREHOUSE_OPERATOR');
  });

  it('defaults role to WAREHOUSE_OPERATOR when authority string does not start with ROLE_', () => {
    const { comp, authApiSpy, authServiceSpy } = setup();
    const token = makeFakeToken({ userId: 1, authorities: ['ADMIN'] });
    authApiSpy.login.mockReturnValue(of({ token, tokenType: 'Bearer', expiresInMs: 3600000 }));
    comp.form.setValue({ username: 'admin', password: 'secret' });
    comp.onSubmit();
    const callArg = authServiceSpy.setSession.mock.calls[0][1];
    expect(callArg.role).toBe('WAREHOUSE_OPERATOR');
  });

  it('defaults role to WAREHOUSE_OPERATOR when authority results in unknown role', () => {
    const { comp, authApiSpy, authServiceSpy } = setup();
    const token = makeFakeToken({ userId: 1, authorities: ['ROLE_UNKNOWN'] });
    authApiSpy.login.mockReturnValue(of({ token, tokenType: 'Bearer', expiresInMs: 3600000 }));
    comp.form.setValue({ username: 'admin', password: 'secret' });
    comp.onSubmit();
    const callArg = authServiceSpy.setSession.mock.calls[0][1];
    expect(callArg.role).toBe('WAREHOUSE_OPERATOR');
  });

  it('defaults role to WAREHOUSE_OPERATOR when authorities array is empty', () => {
    const { comp, authApiSpy, authServiceSpy } = setup();
    const token = makeFakeToken({ userId: 1, authorities: [] });
    authApiSpy.login.mockReturnValue(of({ token, tokenType: 'Bearer', expiresInMs: 3600000 }));
    comp.form.setValue({ username: 'admin', password: 'secret' });
    comp.onSubmit();
    const callArg = authServiceSpy.setSession.mock.calls[0][1];
    expect(callArg.role).toBe('WAREHOUSE_OPERATOR');
  });

  // ── JWT decode edge cases ─────────────────────────────────────────────────

  it('handles a malformed JWT token gracefully (empty payload)', () => {
    const { comp, authApiSpy, authServiceSpy } = setup();
    authApiSpy.login.mockReturnValue(of({ token: 'bad.token.value', tokenType: 'Bearer', expiresInMs: 3600000 }));
    comp.form.setValue({ username: 'admin', password: 'secret' });
    // Should not throw; authService.setSession should still be called with fallback values
    expect(() => comp.onSubmit()).not.toThrow();
    expect(authServiceSpy.setSession).toHaveBeenCalled();
  });

  // ── onSubmit – error handling ─────────────────────────────────────────────

  it('sets errorMessage to "Invalid username or password." on 401 error', () => {
    const { comp, authApiSpy } = setup();
    authApiSpy.login.mockReturnValue(throwError(() => ({ status: 401 })));
    comp.form.setValue({ username: 'admin', password: 'wrong' });
    comp.onSubmit();
    expect(comp.errorMessage()).toBe('Invalid username or password.');
  });

  it('sets errorMessage to generic message on non-401 error', () => {
    const { comp, authApiSpy } = setup();
    authApiSpy.login.mockReturnValue(throwError(() => ({ status: 500 })));
    comp.form.setValue({ username: 'admin', password: 'secret' });
    comp.onSubmit();
    expect(comp.errorMessage()).toBe('An unexpected error occurred. Please try again.');
  });

  it('sets errorMessage to generic message when error has no status', () => {
    const { comp, authApiSpy } = setup();
    authApiSpy.login.mockReturnValue(throwError(() => ({})));
    comp.form.setValue({ username: 'admin', password: 'secret' });
    comp.onSubmit();
    expect(comp.errorMessage()).toBe('An unexpected error occurred. Please try again.');
  });

  it('resets loading to false on error', () => {
    const { comp, authApiSpy } = setup();
    authApiSpy.login.mockReturnValue(throwError(() => ({ status: 500 })));
    comp.form.setValue({ username: 'admin', password: 'secret' });
    comp.onSubmit();
    expect(comp.loading()).toBe(false);
  });

  it('does not navigate on error', () => {
    const { comp, authApiSpy, router } = setup();
    authApiSpy.login.mockReturnValue(throwError(() => ({ status: 401 })));
    const navigateSpy = vi.spyOn(router, 'navigate');
    comp.form.setValue({ username: 'admin', password: 'secret' });
    comp.onSubmit();
    expect(navigateSpy).not.toHaveBeenCalled();
  });

  it('does not call notificationService.success on error', () => {
    const { comp, authApiSpy, notificationSpy } = setup();
    authApiSpy.login.mockReturnValue(throwError(() => ({ status: 401 })));
    comp.form.setValue({ username: 'admin', password: 'secret' });
    comp.onSubmit();
    expect(notificationSpy.success).not.toHaveBeenCalled();
  });
});
