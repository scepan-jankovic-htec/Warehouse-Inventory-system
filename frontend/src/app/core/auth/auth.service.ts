import { Injectable, computed, signal } from '@angular/core';
import { AuthState, CurrentUser } from './auth.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private static readonly ACCESS_TOKEN_KEY = 'wis.accessToken';
  private static readonly CURRENT_USER_KEY = 'wis.currentUser';

  private readonly authState = signal<AuthState>({
    accessToken: this.readToken(),
    isAuthenticated: !!this.readToken()
  });

  private readonly currentUserState = signal<CurrentUser | null>(this.readCurrentUser());

  readonly state = this.authState.asReadonly();
  readonly currentUser = this.currentUserState.asReadonly();
  readonly isAuthenticated = computed(() => this.authState().isAuthenticated);

  setSession(accessToken: string, user: CurrentUser): void {
    this.authState.set({ accessToken, isAuthenticated: true });
    this.currentUserState.set(user);
    localStorage.setItem(AuthService.ACCESS_TOKEN_KEY, accessToken);
    localStorage.setItem(AuthService.CURRENT_USER_KEY, JSON.stringify(user));
  }

  logout(): void {
    this.authState.set({ accessToken: null, isAuthenticated: false });
    this.currentUserState.set(null);
    localStorage.removeItem(AuthService.ACCESS_TOKEN_KEY);
    localStorage.removeItem(AuthService.CURRENT_USER_KEY);
  }

  private readToken(): string | null {
    return localStorage.getItem(AuthService.ACCESS_TOKEN_KEY);
  }

  private readCurrentUser(): CurrentUser | null {
    const raw = localStorage.getItem(AuthService.CURRENT_USER_KEY);
    if (!raw) {
      return null;
    }

    try {
      return JSON.parse(raw) as CurrentUser;
    } catch {
      localStorage.removeItem(AuthService.CURRENT_USER_KEY);
      return null;
    }
  }
}
