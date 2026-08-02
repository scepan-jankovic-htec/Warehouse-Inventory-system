import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthApiService } from '../../services/auth-api.service';
import { AuthService } from '../../../../core/auth/auth.service';
import { NotificationService } from '../../../../core/notification/notification.service';
import { UserRole } from '../../../../core/models/api-enums.model';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  template: `
    <div class="login-page">
      <mat-card class="login-card">
        <mat-card-header>
          <mat-card-title>Warehouse Inventory</mat-card-title>
          <mat-card-subtitle>Sign in to your account</mat-card-subtitle>
        </mat-card-header>

        <mat-card-content>
          <form [formGroup]="form" (ngSubmit)="onSubmit()" novalidate>
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Username</mat-label>
              <input matInput formControlName="username" autocomplete="username" />
              @if (form.controls.username.hasError('required') && form.controls.username.touched) {
                <mat-error>Username is required.</mat-error>
              }
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Password</mat-label>
              <input
                matInput
                [type]="hidePassword() ? 'password' : 'text'"
                formControlName="password"
                autocomplete="current-password"
              />
              <button
                mat-icon-button
                matSuffix
                type="button"
                (click)="togglePassword()"
                [attr.aria-label]="hidePassword() ? 'Show password' : 'Hide password'"
              >
                <mat-icon>{{ hidePassword() ? 'visibility_off' : 'visibility' }}</mat-icon>
              </button>
              @if (form.controls.password.hasError('required') && form.controls.password.touched) {
                <mat-error>Password is required.</mat-error>
              }
            </mat-form-field>

            @if (errorMessage()) {
              <p class="login-error">{{ errorMessage() }}</p>
            }

            <button
              mat-raised-button
              color="primary"
              type="submit"
              class="full-width submit-btn"
              [disabled]="loading()"
            >
              @if (loading()) {
                <mat-spinner diameter="20" />
              } @else {
                Sign In
              }
            </button>
          </form>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [
    `
      .login-page {
        display: flex;
        justify-content: center;
        align-items: center;
        min-height: 100vh;
        background-color: #f5f5f5;
      }

      .login-card {
        width: 100%;
        max-width: 400px;
        padding: 16px;
      }

      .full-width {
        width: 100%;
      }

      .submit-btn {
        margin-top: 8px;
        height: 44px;
      }

      .login-error {
        color: var(--mat-form-field-error-text-color, #f44336);
        font-size: 12px;
        margin: -8px 0 8px;
      }

      mat-card-header {
        margin-bottom: 16px;
      }

      mat-spinner {
        display: inline-block;
      }
    `
  ]
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authApiService = inject(AuthApiService);
  private readonly authService = inject(AuthService);
  private readonly notificationService = inject(NotificationService);
  private readonly router = inject(Router);

  readonly loading = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly hidePassword = signal(true);

  readonly form = this.fb.nonNullable.group({
    username: ['', Validators.required],
    password: ['', Validators.required]
  });

  togglePassword(): void {
    this.hidePassword.update((v) => !v);
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.errorMessage.set(null);

    const { username, password } = this.form.getRawValue();

    this.authApiService.login({ username, password }).subscribe({
      next: (res) => {
        const payload = this.decodeJwtPayload(res.token);
        const role = this.resolveUserRole(payload['authorities']);
        const usernameClaim = this.readStringClaim(payload['username']);
        const fullNameClaim = this.readStringClaim(payload['fullName']);
        const emailClaim = this.readStringClaim(payload['email']);

        this.authService.setSession(res.token, {
          id: typeof payload['userId'] === 'number' ? payload['userId'] : 0,
          username: usernameClaim ?? username,
          fullName: fullNameClaim ?? '',
          email: emailClaim ?? '',
          role,
          active: true
        });
        this.notificationService.success('Signed in successfully.');
        this.router.navigate(['/']);
      },
      error: (err) => {
        this.loading.set(false);
        const status = err?.status;
        if (status === 401) {
          this.errorMessage.set('Invalid username or password.');
        } else {
          this.errorMessage.set('An unexpected error occurred. Please try again.');
        }
      },
      complete: () => this.loading.set(false)
    });
  }

  private decodeJwtPayload(token: string): Record<string, unknown> {
    try {
      const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
      const json = atob(base64);
      return JSON.parse(json) as Record<string, unknown>;
    } catch {
      return {};
    }
  }

  private resolveUserRole(authorities: unknown): UserRole {
    if (!Array.isArray(authorities)) {
      return 'WAREHOUSE_OPERATOR';
    }

    const authority = authorities.find((item) => typeof item === 'string');
    if (typeof authority !== 'string' || !authority.startsWith('ROLE_')) {
      return 'WAREHOUSE_OPERATOR';
    }

    const role = authority.replace('ROLE_', '') as UserRole;
    if (role === 'ADMIN' || role === 'WAREHOUSE_OPERATOR' || role === 'STORE_OPERATOR' || role === 'MANAGER') {
      return role;
    }

    return 'WAREHOUSE_OPERATOR';
  }

  private readStringClaim(value: unknown): string | null {
    return typeof value === 'string' && value.trim().length > 0 ? value : null;
  }
}
