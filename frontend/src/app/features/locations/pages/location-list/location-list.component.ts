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
  templateUrl: './location-list.component.html',
  styleUrls: ['./location-list.component.scss'],
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
