import { Injectable, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { finalize, Observable, tap } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { UserRole } from '../../../core/models/api-enums.model';
import { ApiResponse, PagedResponse } from '../../../core/models/api-response.model';
import {
  UserCreateRequest,
  UserResponse,
  UserUpdateRequest,
} from '../models/user.model';

export interface UserListParams {
  search?: string;
  role?: UserRole;
  active?: boolean;
  sortBy?: 'username' | 'fullName' | 'role';
  sortDir?: 'asc' | 'desc';
  page?: number;
  size?: number;
}

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private readonly baseUrl = `${environment.apiUrl}/users`;

  private readonly _users = signal<UserResponse[]>([]);
  private readonly _selectedUser = signal<UserResponse | null>(null);
  private readonly _isLoading = signal<boolean>(false);
  private readonly _totalElements = signal<number>(0);
  private readonly _totalPages = signal<number>(0);
  private readonly _currentPage = signal<number>(1);

  readonly users = this._users.asReadonly();
  readonly selectedUser = this._selectedUser.asReadonly();
  readonly isLoading = this._isLoading.asReadonly();
  readonly totalElements = this._totalElements.asReadonly();
  readonly totalPages = this._totalPages.asReadonly();
  readonly currentPage = this._currentPage.asReadonly();

  constructor(private readonly http: HttpClient) {}

  loadUsers(params: UserListParams = {}): Observable<PagedResponse<UserResponse>> {
    this._isLoading.set(true);
    return this.getUsers(params).pipe(
      tap((res) => {
        this._users.set(res.data);
        this._totalElements.set(res.pagination.totalElements);
        this._totalPages.set(res.pagination.totalPages);
        this._currentPage.set(res.pagination.page);
      }),
      finalize(() => this._isLoading.set(false))
    );
  }

  loadUser(id: number): Observable<ApiResponse<UserResponse>> {
    this._isLoading.set(true);
    return this.getUser(id).pipe(
      tap((res) => this._selectedUser.set(res.data)),
      finalize(() => this._isLoading.set(false))
    );
  }

  getUsers(params: UserListParams = {}): Observable<PagedResponse<UserResponse>> {
    let httpParams = new HttpParams();
    if (params.search) httpParams = httpParams.set('search', params.search);
    if (params.role) httpParams = httpParams.set('role', params.role);
    if (params.active !== undefined) httpParams = httpParams.set('active', String(params.active));
    if (params.sortBy) httpParams = httpParams.set('sortBy', params.sortBy);
    if (params.sortDir) httpParams = httpParams.set('sortDir', params.sortDir);
    if (params.page !== undefined) httpParams = httpParams.set('page', String(params.page));
    if (params.size !== undefined) httpParams = httpParams.set('size', String(params.size));
    return this.http.get<PagedResponse<UserResponse>>(this.baseUrl, { params: httpParams });
  }

  getUser(id: number): Observable<ApiResponse<UserResponse>> {
    return this.http.get<ApiResponse<UserResponse>>(`${this.baseUrl}/${id}`);
  }

  createUser(body: UserCreateRequest): Observable<ApiResponse<UserResponse>> {
    return this.http.post<ApiResponse<UserResponse>>(this.baseUrl, body);
  }

  updateUser(id: number, body: UserUpdateRequest): Observable<ApiResponse<UserResponse>> {
    return this.http.put<ApiResponse<UserResponse>>(`${this.baseUrl}/${id}`, body);
  }

  deactivateUser(id: number): Observable<void> {
    return this.http.patch<void>(`${this.baseUrl}/${id}/deactivate`, null).pipe(
      tap(() => {
        this._users.update((list) => list.map((item) => (item.id === id ? { ...item, active: false } : item)));
        if (this._selectedUser()?.id === id) {
          this._selectedUser.update((item) => (item ? { ...item, active: false } : null));
        }
      })
    );
  }

  activateUser(id: number): Observable<void> {
    return this.http.patch<void>(`${this.baseUrl}/${id}/activate`, null).pipe(
      tap(() => {
        this._users.update((list) => list.map((item) => (item.id === id ? { ...item, active: true } : item)));
        if (this._selectedUser()?.id === id) {
          this._selectedUser.update((item) => (item ? { ...item, active: true } : null));
        }
      })
    );
  }
}
