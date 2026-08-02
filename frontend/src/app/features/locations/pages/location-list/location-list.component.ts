import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { debounceTime, Subject } from 'rxjs';
import { LocationType } from '../../../../core/models/api-enums.model';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';
import { LoadingSpinnerComponent } from '../../../../shared/components/loading-spinner/loading-spinner.component';
import { PaginationComponent } from '../../../../shared/components/pagination/pagination.component';
import { StatusBadgeComponent } from '../../../../shared/components/status-badge/status-badge.component';
import { LocationResponse } from '../../models/location.model';
import { LocationService } from '../../services/location.service';

@Component({
  selector: 'app-location-list',
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
        <h1>Locations</h1>
        <button class="btn btn-primary" type="button" (click)="createNew()">+ New Location</button>
      </header>

      <section class="filters">
        <input
          class="control"
          type="text"
          placeholder="Search by name"
          [value]="search()"
          (input)="onSearchInput($event)"
        />

        <select class="control" [value]="typeFilter()" (change)="onTypeChange($event)">
          <option value="">All types</option>
          <option value="WAREHOUSE">Warehouse</option>
          <option value="STORE">Store</option>
        </select>

        <label class="active-only">
          <input type="checkbox" [checked]="activeOnly()" (change)="onActiveToggle()" />
          Active only
        </label>
      </section>

      <app-loading-spinner *ngIf="isLoading()" message="Loading locations..." />

      <app-empty-state
        *ngIf="!isLoading() && locations().length === 0"
        title="No locations found"
        description="Try changing filters or create a new location."
      />

      <section class="table-wrapper" *ngIf="!isLoading() && locations().length > 0">
        <table>
          <thead>
            <tr>
              <th class="sortable" (click)="onSort('name')">Name {{ sortMarker('name') }}</th>
              <th class="sortable" (click)="onSort('type')">Type {{ sortMarker('type') }}</th>
              <th>Address</th>
              <th>Status</th>
              <th class="sortable" (click)="onSort('createdAt')">Created {{ sortMarker('createdAt') }}</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let location of locations()">
              <td>{{ location.name }}</td>
              <td>{{ location.type }}</td>
              <td>{{ location.address || '—' }}</td>
              <td>
                <app-status-badge
                  [value]="location.active ? 'ACTIVE' : 'INACTIVE'"
                  [label]="location.active ? 'Active' : 'Inactive'"
                />
              </td>
              <td>{{ formatDate(location.createdAt) }}</td>
              <td class="actions">
                <button class="btn" type="button" (click)="edit(location)">Edit</button>
                <button class="btn" type="button" (click)="toggleActive(location)">
                  {{ location.active ? 'Deactivate' : 'Activate' }}
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </section>

      <app-pagination
        *ngIf="!isLoading() && locations().length > 0"
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
      min-width: 900px;
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
export class LocationListComponent implements OnInit {
  private readonly locationService = inject(LocationService);
  private readonly router = inject(Router);
  private readonly searchSubject = new Subject<string>();

  readonly search = signal('');
  readonly typeFilter = signal<LocationType | ''>('');
  readonly activeOnly = signal(false);
  readonly sortBy = signal<'name' | 'type' | 'createdAt'>('name');
  readonly sortDir = signal<'asc' | 'desc'>('asc');
  readonly currentPage = signal(1);
  readonly pageSize = signal(20);
  readonly errorMessage = signal('');

  readonly locations = this.locationService.locations;
  readonly isLoading = this.locationService.isLoading;
  readonly totalElements = this.locationService.totalElements;
  readonly totalPages = this.locationService.totalPages;

  ngOnInit(): void {
    this.loadLocations();

    this.searchSubject.pipe(debounceTime(300)).subscribe(() => {
      this.currentPage.set(1);
      this.loadLocations();
    });
  }

  onSearchInput(event: Event): void {
    this.search.set((event.target as HTMLInputElement).value);
    this.searchSubject.next(this.search());
  }

  onTypeChange(event: Event): void {
    this.typeFilter.set((event.target as HTMLSelectElement).value as LocationType | '');
    this.currentPage.set(1);
    this.loadLocations();
  }

  onActiveToggle(): void {
    this.activeOnly.update((value) => !value);
    this.currentPage.set(1);
    this.loadLocations();
  }

  onSort(field: 'name' | 'type' | 'createdAt'): void {
    if (this.sortBy() === field) {
      this.sortDir.set(this.sortDir() === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortBy.set(field);
      this.sortDir.set('asc');
    }
    this.loadLocations();
  }

  sortMarker(field: 'name' | 'type' | 'createdAt'): string {
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
    this.loadLocations();
  }

  goNext(): void {
    if (this.currentPage() >= this.totalPages()) {
      return;
    }
    this.currentPage.update((v) => v + 1);
    this.loadLocations();
  }

  createNew(): void {
    this.router.navigate(['/locations/new']);
  }

  edit(location: LocationResponse): void {
    this.router.navigate(['/locations', location.id, 'edit']);
  }

  toggleActive(location: LocationResponse): void {
    const operation = location.active
      ? this.locationService.deactivateLocation(location.id)
      : this.locationService.activateLocation(location.id);

    operation.subscribe({
      next: () => {
        this.errorMessage.set('');
      },
      error: () => {
        this.errorMessage.set(`Failed to ${location.active ? 'deactivate' : 'activate'} location.`);
      },
    });
  }

  formatDate(value: string): string {
    return new Date(value).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }

  private loadLocations(): void {
    this.errorMessage.set('');
    this.locationService
      .loadLocations({
        search: this.search().trim() || undefined,
        type: this.typeFilter() || undefined,
        active: this.activeOnly() ? true : undefined,
        sortBy: this.sortBy(),
        sortDir: this.sortDir(),
        page: this.currentPage(),
        size: this.pageSize(),
      })
      .subscribe({
        error: () => {
          this.errorMessage.set('Failed to load locations.');
        },
      });
  }
}
