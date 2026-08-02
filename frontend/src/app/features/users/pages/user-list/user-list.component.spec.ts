import '@angular/compiler';
import { Injector, runInInjectionContext, signal } from '@angular/core';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { UserService } from '../../services/user.service';
import { UserListComponent } from './user-list.component';

describe('UserListComponent', () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  function createComponent(options?: { loadUsersShouldFail?: boolean; totalPages?: number }) {
    const loadUsersImpl = options?.loadUsersShouldFail
      ? vi.fn(() => throwError(() => new Error('load failed')))
      : vi.fn(() => of({ data: [], pagination: { page: 1, size: 20, totalElements: 0, totalPages: 0 } }));

    const userServiceMock = {
      users: signal([
        {
          id: 1,
          username: 'admin',
          fullName: 'System Admin',
          email: 'admin@example.com',
          role: 'ADMIN' as const,
          active: true,
          createdAt: '2026-08-01T00:00:00Z',
          updatedAt: '2026-08-01T00:00:00Z',
        },
        {
          id: 2,
          username: 'store-op',
          fullName: 'Store Operator',
          email: 'store@example.com',
          role: 'STORE_OPERATOR' as const,
          active: false,
          createdAt: '2026-08-02T00:00:00Z',
          updatedAt: '2026-08-02T00:00:00Z',
        },
      ]),
      isLoading: signal(false),
      totalElements: signal(2),
      totalPages: signal(options?.totalPages ?? 1),
      loadUsers: loadUsersImpl,
      deactivateUser: vi.fn(() => of(void 0)),
      activateUser: vi.fn(() => of(void 0)),
    };

    const routerMock = { navigate: vi.fn() };

    const injector = Injector.create({
      providers: [
        { provide: UserService, useValue: userServiceMock },
        { provide: Router, useValue: routerMock },
      ],
    });

    const component = runInInjectionContext(injector, () => new UserListComponent());
    return { component, routerMock, userServiceMock };
  }

  it('ngOnInit — loads users with default query', () => {
    const { component, userServiceMock } = createComponent();

    component.ngOnInit();

    expect(userServiceMock.loadUsers).toHaveBeenCalledWith({
      search: undefined,
      role: undefined,
      active: undefined,
      sortBy: 'username',
      sortDir: 'asc',
      page: 1,
      size: 20,
    });
  });

  it('ngOnInit — load failure sets error message', () => {
    const { component } = createComponent({ loadUsersShouldFail: true });

    component.ngOnInit();

    expect(component.errorMessage()).toBe('Failed to load users.');
  });

  it('onSearchInput — updates search, debounces reload and resets page', () => {
    vi.useFakeTimers();
    const { component, userServiceMock } = createComponent();

    component.ngOnInit();
    component.currentPage.set(4);
    userServiceMock.loadUsers.mockClear();

    component.onSearchInput({ target: { value: '  admin  ' } } as unknown as Event);

    expect(component.search()).toBe('  admin  ');
    expect(userServiceMock.loadUsers).not.toHaveBeenCalled();

    vi.advanceTimersByTime(300);

    expect(component.currentPage()).toBe(1);
    expect(userServiceMock.loadUsers).toHaveBeenCalledWith({
      search: 'admin',
      role: undefined,
      active: undefined,
      sortBy: 'username',
      sortDir: 'asc',
      page: 1,
      size: 20,
    });
  });

  it('onRoleChange and onActiveToggle — update filters, reset page and reload', () => {
    const { component, userServiceMock } = createComponent();

    component.currentPage.set(3);
    component.onRoleChange({ target: { value: 'MANAGER' } } as unknown as Event);

    expect(component.roleFilter()).toBe('MANAGER');
    expect(component.currentPage()).toBe(1);
    expect(userServiceMock.loadUsers).toHaveBeenLastCalledWith(
      expect.objectContaining({ role: 'MANAGER', page: 1, active: undefined })
    );

    component.currentPage.set(2);
    component.onActiveToggle();

    expect(component.activeOnly()).toBe(true);
    expect(component.currentPage()).toBe(1);
    expect(userServiceMock.loadUsers).toHaveBeenLastCalledWith(
      expect.objectContaining({ role: 'MANAGER', active: true, page: 1 })
    );
  });

  it('onSort and sortMarker — toggles same field and resets new field direction', () => {
    const { component, userServiceMock } = createComponent();

    expect(component.sortMarker('fullName')).toBe('');
    expect(component.sortMarker('username')).toBe('↑');

    component.onSort('username');
    expect(component.sortBy()).toBe('username');
    expect(component.sortDir()).toBe('desc');
    expect(component.sortMarker('username')).toBe('↓');
    expect(userServiceMock.loadUsers).toHaveBeenLastCalledWith(
      expect.objectContaining({ sortBy: 'username', sortDir: 'desc' })
    );

    component.onSort('fullName');
    expect(component.sortBy()).toBe('fullName');
    expect(component.sortDir()).toBe('asc');
    expect(userServiceMock.loadUsers).toHaveBeenLastCalledWith(
      expect.objectContaining({ sortBy: 'fullName', sortDir: 'asc' })
    );
  });

  it('goPrevious and goNext — respect boundaries and reload when page changes', () => {
    const { component, userServiceMock } = createComponent({ totalPages: 3 });

    component.currentPage.set(1);
    component.goPrevious();
    expect(component.currentPage()).toBe(1);

    component.goNext();
    expect(component.currentPage()).toBe(2);

    component.goPrevious();
    expect(component.currentPage()).toBe(1);

    component.currentPage.set(3);
    component.goNext();
    expect(component.currentPage()).toBe(3);

    expect(userServiceMock.loadUsers).toHaveBeenCalledTimes(2);
  });

  it('createNew and edit — navigate to expected routes', () => {
    const { component, routerMock } = createComponent();

    component.createNew();
    component.edit({
      id: 2,
      username: 'store-op',
      fullName: 'Store Operator',
      email: 'store@example.com',
      role: 'STORE_OPERATOR',
      active: false,
      createdAt: '2026-08-02T00:00:00Z',
      updatedAt: '2026-08-02T00:00:00Z',
    });

    expect(routerMock.navigate).toHaveBeenNthCalledWith(1, ['/users/new']);
    expect(routerMock.navigate).toHaveBeenNthCalledWith(2, ['/users', 2, 'edit']);
  });

  it('toggleActive — active user deactivates and clears previous error on success', () => {
    const { component, userServiceMock } = createComponent();

    component.errorMessage.set('Previous error');
    component.toggleActive({
      id: 1,
      username: 'admin',
      fullName: 'System Admin',
      email: 'admin@example.com',
      role: 'ADMIN',
      active: true,
      createdAt: '2026-08-01T00:00:00Z',
      updatedAt: '2026-08-01T00:00:00Z',
    });

    expect(userServiceMock.deactivateUser).toHaveBeenCalledWith(1);
    expect(component.errorMessage()).toBe('');
  });

  it('toggleActive — inactive user activation failure sets error message', () => {
    const { component, userServiceMock } = createComponent();
    userServiceMock.activateUser.mockReturnValueOnce(throwError(() => new Error('boom')));

    component.toggleActive({
      id: 2,
      username: 'store-op',
      fullName: 'Store Operator',
      email: 'store@example.com',
      role: 'STORE_OPERATOR',
      active: false,
      createdAt: '2026-08-02T00:00:00Z',
      updatedAt: '2026-08-02T00:00:00Z',
    });

    expect(userServiceMock.activateUser).toHaveBeenCalledWith(2);
    expect(component.errorMessage()).toBe('Failed to activate user.');
  });
});
