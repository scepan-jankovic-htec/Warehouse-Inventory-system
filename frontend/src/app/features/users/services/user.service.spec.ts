import '@angular/compiler';
import { of } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';
import { UserService } from './user.service';

describe('UserService', () => {
  it('loadUsers — successful response — updates list and pagination signals', () => {
    const httpClientMock = {
      get: vi.fn(() =>
        of({
          data: [
            {
              id: 1,
              username: 'admin',
              fullName: 'Admin User',
              email: 'admin@example.com',
              role: 'ADMIN',
              active: true,
              createdAt: '2026-08-01T00:00:00Z',
              updatedAt: '2026-08-01T00:00:00Z',
            },
          ],
          pagination: { page: 1, size: 20, totalElements: 1, totalPages: 1 },
        })
      ),
      post: vi.fn(() => of({ data: {} })),
      put: vi.fn(() => of({ data: {} })),
      patch: vi.fn(() => of(void 0)),
    };

    const service = new UserService(httpClientMock as never);

    service.loadUsers({ page: 1, size: 20, role: 'ADMIN' }).subscribe();

    expect(service.users().length).toBe(1);
    expect(service.totalElements()).toBe(1);
    expect(service.totalPages()).toBe(1);
    expect(service.currentPage()).toBe(1);
  });

  it('deactivateUser and activateUser — list state — toggles active flag', () => {
    const httpClientMock = {
      get: vi.fn(() =>
        of({
          data: [
            {
              id: 3,
              username: 'operator',
              fullName: 'Warehouse Operator',
              email: 'operator@example.com',
              role: 'WAREHOUSE_OPERATOR',
              active: true,
              createdAt: '2026-08-01T00:00:00Z',
              updatedAt: '2026-08-01T00:00:00Z',
            },
          ],
          pagination: { page: 1, size: 20, totalElements: 1, totalPages: 1 },
        })
      ),
      post: vi.fn(() => of({ data: {} })),
      put: vi.fn(() => of({ data: {} })),
      patch: vi.fn(() => of(void 0)),
    };

    const service = new UserService(httpClientMock as never);

    service.loadUsers({ page: 1, size: 20 }).subscribe();

    service.deactivateUser(3).subscribe();
    expect(service.users()[0]?.active).toBe(false);

    service.activateUser(3).subscribe();
    expect(service.users()[0]?.active).toBe(true);
  });
});
