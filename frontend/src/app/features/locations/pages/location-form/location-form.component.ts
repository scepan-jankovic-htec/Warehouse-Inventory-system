import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiError } from '../../../../core/models/api-error.model';
import { LocationType } from '../../../../core/models/api-enums.model';
import { LocationCreateRequest, LocationUpdateRequest } from '../../models/location.model';
import { LocationService } from '../../services/location.service';

@Component({
  selector: 'app-location-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './location-form.component.html',
  styleUrl: './location-form.component.scss',
})
export class LocationFormComponent implements OnInit {
  private readonly formBuilder = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly locationService = inject(LocationService);

  readonly locationTypes: LocationType[] = ['WAREHOUSE', 'STORE'];
  readonly isEditMode = signal(false);
  readonly isSubmitting = signal(false);
  readonly errorMessage = signal('');

  readonly form = this.formBuilder.group({
    name: ['', [Validators.required, Validators.maxLength(100)]],
    type: [null as LocationType | null, [Validators.required]],
    address: ['', [Validators.maxLength(300)]],
  });

  private locationId: number | null = null;

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (!idParam) {
      return;
    }

    this.locationId = Number(idParam);
    this.isEditMode.set(true);

    this.locationService.loadLocation(this.locationId).subscribe({
      next: (res) => {
        this.form.patchValue({
          name: res.data.name,
          type: res.data.type,
          address: res.data.address ?? '',
        });
      },
      error: () => this.errorMessage.set('Failed to load location for editing.'),
    });
  }

  showError(controlName: keyof typeof this.form.controls, errorName: string): boolean {
    const control = this.form.controls[controlName];
    return !!(control.touched && control.hasError(errorName));
  }

  addressLength(): number {
    return this.form.controls.address.value?.length ?? 0;
  }

  goBack(): void {
    this.router.navigate(['/locations']);
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
    const payload: LocationCreateRequest = {
      name: (this.form.controls.name.value ?? '').trim(),
      type: this.form.controls.type.value as LocationType,
      address: (this.form.controls.address.value ?? '').trim() || undefined,
    };

    this.locationService.createLocation(payload).subscribe({
      next: () => this.router.navigate(['/locations']),
      error: (err) => this.handleApiError(err),
    });
  }

  private update(): void {
    if (!this.locationId) {
      this.handleApiError({ message: 'Invalid location id.' });
      return;
    }

    const payload: LocationUpdateRequest = {
      name: (this.form.controls.name.value ?? '').trim(),
      type: this.form.controls.type.value as LocationType,
      address: (this.form.controls.address.value ?? '').trim() || undefined,
    };

    this.locationService.updateLocation(this.locationId, payload).subscribe({
      next: () => this.router.navigate(['/locations']),
      error: (err) => this.handleApiError(err),
    });
  }

  private handleApiError(error: unknown): void {
    this.isSubmitting.set(false);

    const apiError = error as Partial<ApiError> & { status?: number };

    if (apiError.status === 409) {
      this.form.controls.name.setErrors({ duplicate: true });
      this.form.controls.name.markAsTouched();
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

    this.errorMessage.set(apiError.message ?? 'Failed to save location.');
  }
}
