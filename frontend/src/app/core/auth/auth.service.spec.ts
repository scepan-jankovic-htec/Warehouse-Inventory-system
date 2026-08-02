import '@angular/compiler';
import { describe, expect, it } from 'vitest';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  it('setSession — valid token and user — updates signals and localStorage', () => {
    localStorage.clear();
    const service = new AuthService();

    service.setSession('token-123', {
      id: 1,
      username: 'admin',
      fullName: 'Admin User',
      email: 'admin@example.com',
      role: 'ADMIN',
      active: true,
    });

    expect(service.isAuthenticated()).toBe(true);
    expect(service.state().accessToken).toBe('token-123');
    expect(service.currentUser()?.username).toBe('admin');
    expect(localStorage.getItem('wis.accessToken')).toBe('token-123');
  });

  it('logout — active session — clears auth state and storage', () => {
    localStorage.clear();
    const service = new AuthService();

    service.setSession('token-123', {
      id: 1,
      username: 'admin',
      fullName: 'Admin User',
      email: 'admin@example.com',
      role: 'ADMIN',
      active: true,
    });

    service.logout();

    expect(service.isAuthenticated()).toBe(false);
    expect(service.state().accessToken).toBeNull();
    expect(service.currentUser()).toBeNull();
    expect(localStorage.getItem('wis.accessToken')).toBeNull();
  });
});
