export type UserRole = 'ADMIN' | 'WAREHOUSE_OPERATOR' | 'STORE_OPERATOR' | 'MANAGER';

export interface AuthState {
  accessToken: string | null;
  isAuthenticated: boolean;
}

export interface CurrentUser {
  id: number;
  username: string;
  fullName: string;
  email: string;
  role: UserRole;
  active: boolean;
}
