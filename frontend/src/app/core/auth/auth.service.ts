import { Injectable, computed, signal } from '@angular/core';
import { AuthState, CurrentUser } from './auth.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly authState = signal<AuthState>({
    accessToken: null,
    isAuthenticated: false
  });

  private readonly currentUserState = signal<CurrentUser | null>(null);

  readonly state = this.authState.asReadonly();
  readonly currentUser = this.currentUserState.asReadonly();
  readonly isAuthenticated = computed(() => this.authState().isAuthenticated);
}
