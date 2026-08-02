import { Injectable, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { finalize, Observable, tap } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { LocationType } from '../../../core/models/api-enums.model';
import { ApiResponse, PagedResponse } from '../../../core/models/api-response.model';
import {
  LocationCreateRequest,
  LocationResponse,
  LocationUpdateRequest,
} from '../models/location.model';

export interface LocationListParams {
  search?: string;
  type?: LocationType;
  active?: boolean;
  sortBy?: 'name' | 'type' | 'createdAt';
  sortDir?: 'asc' | 'desc';
  page?: number;
  size?: number;
}

@Injectable({
  providedIn: 'root',
})
export class LocationService {
  private readonly baseUrl = `${environment.apiUrl}/locations`;

  private readonly _locations = signal<LocationResponse[]>([]);
  private readonly _selectedLocation = signal<LocationResponse | null>(null);
  private readonly _isLoading = signal<boolean>(false);
  private readonly _totalElements = signal<number>(0);
  private readonly _totalPages = signal<number>(0);
  private readonly _currentPage = signal<number>(1);

  readonly locations = this._locations.asReadonly();
  readonly selectedLocation = this._selectedLocation.asReadonly();
  readonly isLoading = this._isLoading.asReadonly();
  readonly totalElements = this._totalElements.asReadonly();
  readonly totalPages = this._totalPages.asReadonly();
  readonly currentPage = this._currentPage.asReadonly();

  constructor(private readonly http: HttpClient) {}

  loadLocations(params: LocationListParams = {}): Observable<PagedResponse<LocationResponse>> {
    this._isLoading.set(true);
    return this.getLocations(params).pipe(
      tap((res) => {
        this._locations.set(res.data);
        this._totalElements.set(res.pagination.totalElements);
        this._totalPages.set(res.pagination.totalPages);
        this._currentPage.set(res.pagination.page);
      }),
      finalize(() => this._isLoading.set(false))
    );
  }

  loadLocation(id: number): Observable<ApiResponse<LocationResponse>> {
    this._isLoading.set(true);
    return this.getLocation(id).pipe(
      tap((res) => this._selectedLocation.set(res.data)),
      finalize(() => this._isLoading.set(false))
    );
  }

  getLocations(params: LocationListParams = {}): Observable<PagedResponse<LocationResponse>> {
    let httpParams = new HttpParams();
    if (params.search) httpParams = httpParams.set('search', params.search);
    if (params.type) httpParams = httpParams.set('type', params.type);
    if (params.active !== undefined) httpParams = httpParams.set('active', String(params.active));
    if (params.sortBy) httpParams = httpParams.set('sortBy', params.sortBy);
    if (params.sortDir) httpParams = httpParams.set('sortDir', params.sortDir);
    if (params.page !== undefined) httpParams = httpParams.set('page', String(params.page));
    if (params.size !== undefined) httpParams = httpParams.set('size', String(params.size));
    return this.http.get<PagedResponse<LocationResponse>>(this.baseUrl, { params: httpParams });
  }

  getLocation(id: number): Observable<ApiResponse<LocationResponse>> {
    return this.http.get<ApiResponse<LocationResponse>>(`${this.baseUrl}/${id}`);
  }

  createLocation(body: LocationCreateRequest): Observable<ApiResponse<LocationResponse>> {
    return this.http.post<ApiResponse<LocationResponse>>(this.baseUrl, body);
  }

  updateLocation(id: number, body: LocationUpdateRequest): Observable<ApiResponse<LocationResponse>> {
    return this.http.put<ApiResponse<LocationResponse>>(`${this.baseUrl}/${id}`, body);
  }

  deactivateLocation(id: number): Observable<void> {
    return this.http.patch<void>(`${this.baseUrl}/${id}/deactivate`, null).pipe(
      tap(() => {
        this._locations.update((list) => list.map((item) => (item.id === id ? { ...item, active: false } : item)));
        if (this._selectedLocation()?.id === id) {
          this._selectedLocation.update((item) => (item ? { ...item, active: false } : null));
        }
      })
    );
  }

  activateLocation(id: number): Observable<void> {
    return this.http.patch<void>(`${this.baseUrl}/${id}/activate`, null).pipe(
      tap(() => {
        this._locations.update((list) => list.map((item) => (item.id === id ? { ...item, active: true } : item)));
        if (this._selectedLocation()?.id === id) {
          this._selectedLocation.update((item) => (item ? { ...item, active: true } : null));
        }
      })
    );
  }
}
