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
  template: `
    <section class="page">
      <header class="header">
        <h1>{{ isEditMode() ? 'Edit Location' : 'New Location' }}</h1>
        <button class="btn" type="button" (click)="goBack()">← Back</button>
      </header>

      <form class="form" [formGroup]="form" (ngSubmit)="submit()">
        <div class="grid">
          <div class="field">
            <label for="name">Name *</label>
            <input id="name" type="text" formControlName="name" maxlength="100" placeholder="Warehouse A" />
            <small *ngIf="showError('name', 'required')">Name is required.</small>
            <small *ngIf="showError('name', 'maxlength')">Name must be at most 100 characters.</small>
            <small *ngIf="showError('name', 'duplicate')">This location name is already in use.</small>
          </div>

          <div class="field">
            <label for="type">Type *</label>
            <select id="type" formControlName="type">
              <option [ngValue]="null">Select type</option>
              <option *ngFor="let type of locationTypes" [ngValue]="type">{{ type }}</option>
            </select>
            <small *ngIf="showError('type', 'required')">Type is required.</small>
          </div>

          <div class="field full-width">
            <label for="address">Address</label>
            <textarea
              id="address"
              rows="4"
              formControlName="address"
              maxlength="300"
              placeholder="12 Industrial Road, Belgrade"
            ></textarea>
            <div class="char-counter">{{ addressLength() }} / 300</div>
            <small *ngIf="showError('address', 'maxlength')">Address must be at most 300 characters.</small>
          </div>
        </div>

        <div class="actions">
          <button class="btn" type="button" (click)="goBack()">Cancel</button>
          <button class="btn btn-primary" type="submit" [disabled]="form.invalid || isSubmitting()">
            {{ isSubmitting() ? 'Saving...' : isEditMode() ? 'Update Location' : 'Create Location' }}
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

    .full-width {
      grid-column: 1 / -1;
    }

    label {
      font-size: 13px;
      color: #334155;
      font-weight: 600;
    }

    input,
    textarea,
    select {
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      padding: 9px 10px;
      font-size: 14px;
      background: #fff;
      font-family: inherit;
    }

    textarea {
      resize: vertical;
    }

    input.ng-touched.ng-invalid,
    textarea.ng-touched.ng-invalid,
    select.ng-touched.ng-invalid {
      border-color: #dc2626;
      background: #fef2f2;
    }

    .char-counter {
      font-size: 12px;
      color: #64748b;
      text-align: right;
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
