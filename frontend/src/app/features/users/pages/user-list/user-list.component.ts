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
  templateUrl: './user-list.component.html',
  styleUrls: ['./user-list.component.scss'],
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
