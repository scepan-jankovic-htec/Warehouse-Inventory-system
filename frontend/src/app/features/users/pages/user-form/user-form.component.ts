import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiError } from '../../../../core/models/api-error.model';
import { UserRole } from '../../../../core/models/api-enums.model';
import { UserCreateRequest, UserUpdateRequest } from '../../models/user.model';
import { UserService } from '../../services/user.service';

@Component({
  selector: 'app-user-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <section class="page">
      <header class="header">
        <h1>{{ isEditMode() ? 'Edit User' : 'New User' }}</h1>
        <button class="btn" type="button" (click)="goBack()">← Back</button>
      </header>

      <form class="form" [formGroup]="form" (ngSubmit)="submit()">
        <div class="grid">
          <div class="field">
            <label for="username">Username *</label>
            <input id="username" type="text" formControlName="username" maxlength="50" />
            <small *ngIf="showError('username', 'required')">Username is required.</small>
            <small *ngIf="showError('username', 'maxlength')">Username must be at most 50 characters.</small>
            <small *ngIf="showError('username', 'duplicate')">This username is already in use.</small>
          </div>

          <div class="field" *ngIf="!isEditMode()">
            <label for="password">Password *</label>
            <input id="password" type="password" formControlName="password" />
            <small *ngIf="showError('password', 'required')">Password is required.</small>
            <small *ngIf="showError('password', 'minlength')">Password must be at least 8 characters.</small>
          </div>

          <div class="field">
            <label for="fullName">Full Name *</label>
            <input id="fullName" type="text" formControlName="fullName" maxlength="100" />
            <small *ngIf="showError('fullName', 'required')">Full name is required.</small>
            <small *ngIf="showError('fullName', 'maxlength')">Full name must be at most 100 characters.</small>
          </div>

          <div class="field">
            <label for="email">Email *</label>
            <input id="email" type="email" formControlName="email" maxlength="255" />
            <small *ngIf="showError('email', 'required')">Email is required.</small>
            <small *ngIf="showError('email', 'email')">Enter a valid email.</small>
            <small *ngIf="showError('email', 'duplicate')">This email is already in use.</small>
          </div>

          <div class="field">
            <label for="role">Role *</label>
            <select id="role" formControlName="role">
              <option [ngValue]="null">Select role</option>
              <option *ngFor="let role of roleOptions" [value]="role">{{ role }}</option>
            </select>
            <small *ngIf="showError('role', 'required')">Role is required.</small>
          </div>
        </div>

        <div class="actions">
          <button class="btn" type="button" (click)="goBack()">Cancel</button>
          <button class="btn btn-primary" type="submit" [disabled]="form.invalid || isSubmitting()">
            {{ isSubmitting() ? 'Saving...' : isEditMode() ? 'Update User' : 'Create User' }}
          </button>
        </div>

        <p class="error" *ngIf="errorMessage()">{{ errorMessage() }}</p>
      </form>
    </section>
  `,
  styles: `
    .page {
      max-width: 900px;
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
      font-size: 24px;
    }

    .form {
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      background: #fff;
      padding: 18px;
      display: grid;
      gap: 16px;
    }

    .grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 14px;
    }

    .field {
      display: grid;
      gap: 6px;
    }

    label {
      font-size: 13px;
      color: #334155;
      font-weight: 600;
    }

    input,
    select {
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      padding: 9px 10px;
      font-size: 14px;
      background: #fff;
      font-family: inherit;
    }

    input.ng-touched.ng-invalid,
    select.ng-touched.ng-invalid {
      border-color: #dc2626;
      background: #fef2f2;
    }

    small {
      color: #b91c1c;
      font-size: 12px;
    }

    .actions {
      display: flex;
      justify-content: flex-end;
      gap: 8px;
      border-top: 1px solid #e2e8f0;
      padding-top: 14px;
    }

    .btn {
      border: 1px solid #cbd5e1;
      background: #fff;
      color: #0f172a;
      border-radius: 6px;
      padding: 8px 12px;
      cursor: pointer;
    }

    .btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
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

    @media (max-width: 800px) {
      .grid {
        grid-template-columns: 1fr;
      }
    }
  `,
})
export class UserFormComponent implements OnInit {
  private readonly formBuilder = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly userService = inject(UserService);

  readonly roleOptions: UserRole[] = ['ADMIN', 'WAREHOUSE_OPERATOR', 'STORE_OPERATOR', 'MANAGER'];
  readonly isEditMode = signal(false);
  readonly isSubmitting = signal(false);
  readonly errorMessage = signal('');

  readonly form = this.formBuilder.group({
    username: ['', [Validators.required, Validators.maxLength(50)]],
    password: ['', [Validators.required, Validators.minLength(8)]],
    fullName: ['', [Validators.required, Validators.maxLength(100)]],
    email: ['', [Validators.required, Validators.email, Validators.maxLength(255)]],
    role: [null as UserRole | null, [Validators.required]],
  });

  private userId: number | null = null;

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (!idParam) {
      return;
    }

    this.userId = Number(idParam);
    this.isEditMode.set(true);
    this.form.controls.username.disable();
    this.form.controls.password.clearValidators();
    this.form.controls.password.setValue('');
    this.form.controls.password.updateValueAndValidity();

    this.userService.loadUser(this.userId).subscribe({
      next: (res) => {
        this.form.patchValue({
          username: res.data.username,
          fullName: res.data.fullName,
          email: res.data.email,
          role: res.data.role,
        });
      },
      error: () => this.errorMessage.set('Failed to load user for editing.'),
    });
  }

  showError(controlName: keyof typeof this.form.controls, errorName: string): boolean {
    const control = this.form.controls[controlName];
    return !!(control.touched && control.hasError(errorName));
  }

  goBack(): void {
    this.router.navigate(['/users']);
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set('');

    if (this.isEditMode()) {
      this.update();
      return;
    }

    this.create();
  }

  private create(): void {
    const payload: UserCreateRequest = {
      username: (this.form.controls.username.value ?? '').trim(),
      password: this.form.controls.password.value ?? '',
      fullName: (this.form.controls.fullName.value ?? '').trim(),
      email: (this.form.controls.email.value ?? '').trim(),
      role: this.form.controls.role.value as UserRole,
    };

    this.userService.createUser(payload).subscribe({
      next: () => this.router.navigate(['/users']),
      error: (err) => this.handleApiError(err),
    });
  }

  private update(): void {
    if (!this.userId) {
      this.handleApiError({ message: 'Invalid user id.' });
      return;
    }

    const payload: UserUpdateRequest = {
      fullName: (this.form.controls.fullName.value ?? '').trim(),
      email: (this.form.controls.email.value ?? '').trim(),
      role: this.form.controls.role.value as UserRole,
    };

    this.userService.updateUser(this.userId, payload).subscribe({
      next: () => this.router.navigate(['/users']),
      error: (err) => this.handleApiError(err),
    });
  }

  private handleApiError(error: unknown): void {
    this.isSubmitting.set(false);

    const apiError = error as Partial<ApiError> & { status?: number };

    if (apiError.status === 409 && apiError.fieldErrors?.length) {
      for (const fieldError of apiError.fieldErrors) {
        const control = this.form.get(fieldError.field);
        if (!control) {
          continue;
        }
        control.setErrors({ duplicate: true });
        control.markAsTouched();
      }
      return;
    }

    if (apiError.fieldErrors?.length) {
      for (const fieldError of apiError.fieldErrors) {
        const control = this.form.get(fieldError.field);
        if (!control) {
          continue;
        }
        control.setErrors({ server: fieldError.message });
        control.markAsTouched();
      }
      return;
    }

    this.errorMessage.set(apiError.message ?? 'Failed to save user.');
  }
}
