import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { debounceTime, Subject } from 'rxjs';
import { UserRole } from '../../../../core/models/api-enums.model';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';
import { LoadingSpinnerComponent } from '../../../../shared/components/loading-spinner/loading-spinner.component';
import { PaginationComponent } from '../../../../shared/components/pagination/pagination.component';
import { StatusBadgeComponent } from '../../../../shared/components/status-badge/status-badge.component';
import { UserResponse } from '../../models/user.model';
import { UserService } from '../../services/user.service';

@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [
    CommonModule,
    EmptyStateComponent,
    LoadingSpinnerComponent,
    PaginationComponent,
    StatusBadgeComponent,
  ],
  template: `
    <section class="page">
      <header class="header">
        <h1>Users</h1>
        <button class="btn btn-primary" type="button" (click)="createNew()">+ New User</button>
      </header>

      <section class="filters">
        <input
          class="control"
          type="text"
          placeholder="Search by username or full name"
          [value]="search()"
          (input)="onSearchInput($event)"
        />

        <select class="control" [value]="roleFilter()" (change)="onRoleChange($event)">
          <option value="">All roles</option>
          <option *ngFor="let role of roleOptions" [value]="role">{{ role }}</option>
        </select>

        <label class="active-only">
          <input type="checkbox" [checked]="activeOnly()" (change)="onActiveToggle()" />
          Active only
        </label>
      </section>

      <app-loading-spinner *ngIf="isLoading()" message="Loading users..." />

      <app-empty-state
        *ngIf="!isLoading() && users().length === 0"
        title="No users found"
        description="Try changing filters or create a new user account."
      />

      <section class="table-wrapper" *ngIf="!isLoading() && users().length > 0">
        <table>
          <thead>
            <tr>
              <th class="sortable" (click)="onSort('username')">Username {{ sortMarker('username') }}</th>
              <th class="sortable" (click)="onSort('fullName')">Full Name {{ sortMarker('fullName') }}</th>
              <th>Email</th>
              <th class="sortable" (click)="onSort('role')">Role {{ sortMarker('role') }}</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let user of users()">
              <td>{{ user.username }}</td>
              <td>{{ user.fullName }}</td>
              <td>{{ user.email }}</td>
              <td>{{ user.role }}</td>
              <td>
                <app-status-badge
                  [value]="user.active ? 'ACTIVE' : 'INACTIVE'"
                  [label]="user.active ? 'Active' : 'Inactive'"
                />
              </td>
              <td class="actions">
                <button class="btn" type="button" (click)="edit(user)">Edit</button>
                <button class="btn" type="button" (click)="toggleActive(user)">
                  {{ user.active ? 'Deactivate' : 'Activate' }}
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </section>

      <app-pagination
        *ngIf="!isLoading() && users().length > 0"
        [page]="currentPage()"
        [totalPages]="totalPages()"
        [totalElements]="totalElements()"
        (previous)="goPrevious()"
        (next)="goNext()"
      />

      <p class="error" *ngIf="errorMessage()">{{ errorMessage() }}</p>
    </section>
  `,
  styles: `
    .page {
      max-width: 1200px;
      margin: 0 auto;
      padding: 24px;
      display: grid;
      gap: 16px;
    }

    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 12px;
      flex-wrap: wrap;
    }

    .header h1 {
      margin: 0;
      color: #0f172a;
      font-size: 26px;
    }

    .filters {
      display: grid;
      grid-template-columns: 1.4fr 1fr auto;
      gap: 10px;
      align-items: center;
    }

    .control {
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      padding: 9px 10px;
      font-size: 14px;
      background: #fff;
    }

    .active-only {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      color: #334155;
      font-size: 14px;
    }

    .table-wrapper {
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      overflow-x: auto;
      background: #fff;
    }

    table {
      width: 100%;
      min-width: 980px;
      border-collapse: collapse;
    }

    th,
    td {
      text-align: left;
      padding: 10px 12px;
      border-bottom: 1px solid #e2e8f0;
      font-size: 14px;
    }

    th {
      background: #f8fafc;
      color: #334155;
      font-weight: 600;
      white-space: nowrap;
    }

    .sortable {
      cursor: pointer;
      user-select: none;
    }

    .actions {
      display: flex;
      gap: 8px;
    }

    .btn {
      border: 1px solid #cbd5e1;
      background: #fff;
      color: #0f172a;
      border-radius: 6px;
      padding: 8px 12px;
      cursor: pointer;
    }

    .btn-primary {
      border-color: #2563eb;
      background: #2563eb;
      color: #fff;
    }

    .error {
      margin: 0;
      color: #b91c1c;
      background: #fee2e2;
      border: 1px solid #fecaca;
      border-radius: 6px;
      padding: 10px 12px;
      font-size: 14px;
    }

    @media (max-width: 900px) {
      .filters {
        grid-template-columns: 1fr;
      }
    }
  `,
})
export class UserListComponent implements OnInit {
  private readonly userService = inject(UserService);
  private readonly router = inject(Router);
  private readonly searchSubject = new Subject<string>();

  readonly roleOptions: UserRole[] = ['ADMIN', 'WAREHOUSE_OPERATOR', 'STORE_OPERATOR', 'MANAGER'];

  readonly search = signal('');
  readonly roleFilter = signal<UserRole | ''>('');
  readonly activeOnly = signal(false);
  readonly sortBy = signal<'username' | 'fullName' | 'role'>('username');
  readonly sortDir = signal<'asc' | 'desc'>('asc');
  readonly currentPage = signal(1);
  readonly pageSize = signal(20);
  readonly errorMessage = signal('');

  readonly users = this.userService.users;
  readonly isLoading = this.userService.isLoading;
  readonly totalElements = this.userService.totalElements;
  readonly totalPages = this.userService.totalPages;

  ngOnInit(): void {
    this.loadUsers();

    this.searchSubject.pipe(debounceTime(300)).subscribe(() => {
      this.currentPage.set(1);
      this.loadUsers();
    });
  }

  onSearchInput(event: Event): void {
    this.search.set((event.target as HTMLInputElement).value);
    this.searchSubject.next(this.search());
  }

  onRoleChange(event: Event): void {
    this.roleFilter.set((event.target as HTMLSelectElement).value as UserRole | '');
    this.currentPage.set(1);
    this.loadUsers();
  }

  onActiveToggle(): void {
    this.activeOnly.update((value) => !value);
    this.currentPage.set(1);
    this.loadUsers();
  }

  onSort(field: 'username' | 'fullName' | 'role'): void {
    if (this.sortBy() === field) {
      this.sortDir.set(this.sortDir() === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortBy.set(field);
      this.sortDir.set('asc');
    }
    this.loadUsers();
  }

  sortMarker(field: 'username' | 'fullName' | 'role'): string {
    if (this.sortBy() !== field) {
      return '';
    }
    return this.sortDir() === 'asc' ? '↑' : '↓';
  }

  goPrevious(): void {
    if (this.currentPage() <= 1) {
      return;
    }
    this.currentPage.update((v) => v - 1);
    this.loadUsers();
  }

  goNext(): void {
    if (this.currentPage() >= this.totalPages()) {
      return;
    }
    this.currentPage.update((v) => v + 1);
    this.loadUsers();
  }

  createNew(): void {
    this.router.navigate(['/users/new']);
  }

  edit(user: UserResponse): void {
    this.router.navigate(['/users', user.id, 'edit']);
  }

  toggleActive(user: UserResponse): void {
    const operation = user.active
      ? this.userService.deactivateUser(user.id)
      : this.userService.activateUser(user.id);

    operation.subscribe({
      next: () => this.errorMessage.set(''),
      error: () => this.errorMessage.set(`Failed to ${user.active ? 'deactivate' : 'activate'} user.`),
    });
  }

  private loadUsers(): void {
    this.errorMessage.set('');
    this.userService
      .loadUsers({
        search: this.search().trim() || undefined,
        role: this.roleFilter() || undefined,
        active: this.activeOnly() ? true : undefined,
        sortBy: this.sortBy(),
        sortDir: this.sortDir(),
        page: this.currentPage(),
        size: this.pageSize(),
      })
      .subscribe({
        error: () => {
          this.errorMessage.set('Failed to load users.');
        },
      });
  }
}
