import '@angular/compiler';
import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { AuthService } from '../../core/auth/auth.service';
import { SidebarComponent } from './sidebar.component';

describe('SidebarComponent', () => {
  it('canShowItem — admin role — allows admin-only links', () => {
    const authServiceMock = {
      currentUser: signal({
        id: 1,
        username: 'admin',
        fullName: 'Admin User',
        email: 'admin@example.com',
        role: 'ADMIN',
        active: true,
      }),
    };

    TestBed.configureTestingModule({
      imports: [SidebarComponent],
      providers: [{ provide: AuthService, useValue: authServiceMock }],
    });

    const fixture = TestBed.createComponent(SidebarComponent);
    const component = fixture.componentInstance;

    expect(component.canShowItem({ label: 'Users', icon: '👥', route: '/users', requiredRole: 'ADMIN' })).toBe(true);
    expect(component.canShowItem({ label: 'Dashboard', icon: '📊', route: '/dashboard' })).toBe(true);
  });
});
