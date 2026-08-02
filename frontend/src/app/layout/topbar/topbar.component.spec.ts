import '@angular/compiler';
import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { describe, expect, it, vi } from 'vitest';
import { AuthService } from '../../core/auth/auth.service';
import { TopbarComponent } from './topbar.component';

describe('TopbarComponent', () => {
  it('logout — invokes auth logout and navigates to login', () => {
    const authServiceMock = {
      currentUser: signal({
        id: 1,
        username: 'admin',
        fullName: 'Admin User',
        email: 'admin@example.com',
        role: 'ADMIN',
        active: true,
      }),
      logout: vi.fn(),
    };
    const routerMock = { navigate: vi.fn() };

    TestBed.configureTestingModule({
      imports: [TopbarComponent],
      providers: [
        { provide: AuthService, useValue: authServiceMock },
        { provide: Router, useValue: routerMock },
      ],
    });

    const fixture = TestBed.createComponent(TopbarComponent);
    fixture.componentInstance.logout();

    expect(authServiceMock.logout).toHaveBeenCalledTimes(1);
    expect(routerMock.navigate).toHaveBeenCalledWith(['/login']);
  });
});
