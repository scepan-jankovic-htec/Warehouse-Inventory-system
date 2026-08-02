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
  templateUrl: './user-form.component.html',
  styleUrls: ['./user-form.component.scss'],
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
