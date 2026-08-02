import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, signal } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ProductResponse } from '../../../products/models/product.model';
import { LocationResponse } from '../../../locations/models/location.model';
import { InventoryService } from '../../services/inventory.service';

function nonZeroValidator(control: AbstractControl): ValidationErrors | null {
  const value = Number(control.value ?? 0);
  if (value === 0) {
    return { nonZero: true };
  }
  return null;
}

@Component({
  selector: 'app-adjustment-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <section class="page">
      <header class="header">
        <h1>Adjust Stock</h1>
        <button type="button" class="btn" (click)="goBack()">← Back</button>
      </header>

      <form class="form" [formGroup]="form" (ngSubmit)="submit()">
        <div class="grid">
          <div class="field">
            <label for="productId">Product *</label>
            <select id="productId" formControlName="productId" (change)="refreshCurrentQuantity()">
              <option [ngValue]="null">Select product</option>
              <option *ngFor="let product of products()" [ngValue]="product.id">
                {{ product.sku }} — {{ product.name }}
              </option>
            </select>
            <small *ngIf="showError('productId', 'required')">Product is required.</small>
          </div>

          <div class="field">
            <label for="locationId">Location *</label>
            <select id="locationId" formControlName="locationId" (change)="refreshCurrentQuantity()">
              <option [ngValue]="null">Select location</option>
              <option *ngFor="let location of locations()" [ngValue]="location.id">
                {{ location.name }} ({{ location.type }})
              </option>
            </select>
            <small *ngIf="showError('locationId', 'required')">Location is required.</small>
          </div>

          <div class="field">
            <label for="quantityDelta">Quantity delta *</label>
            <input id="quantityDelta" type="number" formControlName="quantityDelta" />
            <small *ngIf="showError('quantityDelta', 'required')">Quantity delta is required.</small>
            <small *ngIf="showError('quantityDelta', 'nonZero')">Quantity delta must be non-zero.</small>
          </div>

          <div class="field">
            <label for="referenceId">Reference ID</label>
            <input id="referenceId" type="text" maxlength="100" formControlName="referenceId" />
            <small *ngIf="showError('referenceId', 'maxlength')">Reference must be at most 100 characters.</small>
          </div>

          <div class="field full-width">
            <label for="reason">Reason *</label>
            <textarea id="reason" rows="3" maxlength="500" formControlName="reason"></textarea>
            <small *ngIf="showError('reason', 'required')">Reason is required.</small>
            <small *ngIf="showError('reason', 'maxlength')">Reason must be at most 500 characters.</small>
          </div>
        </div>

        <p class="info">Current quantity: <strong>{{ currentQuantity() }}</strong></p>
        <p class="info">Quantity after adjustment: <strong>{{ projectedQuantity() }}</strong></p>

        <p class="error" *ngIf="projectedQuantity() < 0">Adjustment would make inventory negative.</p>

        <div class="actions">
          <button type="button" class="btn" (click)="goBack()">Cancel</button>
          <button
            class="btn btn-primary"
            type="submit"
            [disabled]="form.invalid || projectedQuantity() < 0 || isSubmitting()"
          >
            {{ isSubmitting() ? 'Saving...' : 'Increase/Decrease Stock' }}
          </button>
        </div>

        <p class="error" *ngIf="errorMessage()">{{ errorMessage() }}</p>
      </form>
    </section>
  `,
  styles: `
    .page { max-width: 900px; margin: 0 auto; padding: 24px; display: grid; gap: 16px; }
    .header { display: flex; justify-content: space-between; align-items: center; }
    .header h1 { margin: 0; font-size: 24px; color: #0f172a; }
    .form { border: 1px solid #e2e8f0; border-radius: 8px; background: #fff; padding: 18px; display: grid; gap: 16px; }
    .grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px; }
    .field { display: grid; gap: 6px; }
    .full-width { grid-column: 1 / -1; }
    label { font-size: 13px; color: #334155; font-weight: 600; }
    input, textarea, select { border: 1px solid #cbd5e1; border-radius: 8px; padding: 9px 10px; font-size: 14px; background: #fff; }
    textarea { resize: vertical; }
    input.ng-touched.ng-invalid, textarea.ng-touched.ng-invalid, select.ng-touched.ng-invalid { border-color: #dc2626; background: #fef2f2; }
    small { color: #b91c1c; font-size: 12px; }
    .info { margin: 0; color: #334155; font-size: 14px; }
    .actions { display: flex; justify-content: flex-end; gap: 8px; border-top: 1px solid #e2e8f0; padding-top: 14px; }
    .btn { border: 1px solid #cbd5e1; background: #fff; color: #0f172a; border-radius: 6px; padding: 8px 12px; cursor: pointer; }
    .btn:disabled { opacity: 0.5; cursor: not-allowed; }
    .btn-primary { border-color: #2563eb; background: #2563eb; color: #fff; }
    .error { margin: 0; color: #b91c1c; background: #fee2e2; border: 1px solid #fecaca; border-radius: 6px; padding: 10px 12px; font-size: 14px; }
    @media (max-width: 800px) { .grid { grid-template-columns: 1fr; } }
  `,
})
export class AdjustmentFormComponent implements OnInit {
  readonly products = signal<ProductResponse[]>([]);
  readonly locations = signal<LocationResponse[]>([]);
  readonly currentQuantity = signal(0);
  readonly isSubmitting = signal(false);
  readonly errorMessage = signal('');

  readonly form;

  readonly projectedQuantity = computed(() => {
    const delta = Number(this.form.controls.quantityDelta.value ?? 0);
    return this.currentQuantity() + delta;
  });

  constructor(
    private readonly formBuilder: FormBuilder,
    private readonly router: Router,
    private readonly inventoryService: InventoryService
  ) {
    this.form = this.formBuilder.group({
      productId: [null as number | null, [Validators.required]],
      locationId: [null as number | null, [Validators.required]],
      quantityDelta: [0, [Validators.required, nonZeroValidator]],
      reason: ['', [Validators.required, Validators.maxLength(500)]],
      referenceId: ['', [Validators.maxLength(100)]],
    });
  }

  ngOnInit(): void {
    this.inventoryService.getProductOptions().subscribe({
      next: (res) => this.products.set(res.data),
      error: () => this.errorMessage.set('Failed to load products.'),
    });

    this.inventoryService.getLocationOptions().subscribe({
      next: (res) => this.locations.set(res.data),
      error: () => this.errorMessage.set('Failed to load locations.'),
    });
  }

  showError(controlName: keyof typeof this.form.controls, errorName: string): boolean {
    const control = this.form.controls[controlName];
    return !!(control.touched && control.hasError(errorName));
  }

  refreshCurrentQuantity(): void {
    const productId = Number(this.form.controls.productId.value);
    const locationId = Number(this.form.controls.locationId.value);

    if (!productId || !locationId) {
      this.currentQuantity.set(0);
      return;
    }

    this.inventoryService.getInventoryByProductAndLocation(productId, locationId).subscribe({
      next: (res) => this.currentQuantity.set(res.data.quantityOnHand),
      error: () => this.currentQuantity.set(0),
    });
  }

  goBack(): void {
    this.router.navigate(['/inventory']);
  }

  submit(): void {
    if (this.projectedQuantity() < 0) {
      this.errorMessage.set('Adjustment would result in negative stock.');
      return;
    }

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set('');

    this.inventoryService
      .adjust({
        productId: Number(this.form.controls.productId.value),
        locationId: Number(this.form.controls.locationId.value),
        quantityDelta: Number(this.form.controls.quantityDelta.value),
        reason: (this.form.controls.reason.value ?? '').trim(),
        referenceId: (this.form.controls.referenceId.value ?? '').trim() || undefined,
      })
      .subscribe({
        next: () => this.router.navigate(['/inventory']),
        error: (err: { status?: number; message?: string }) => {
          this.isSubmitting.set(false);
          if (err.status === 422) {
            this.errorMessage.set('Adjustment rejected: negative result or inactive resources.');
            return;
          }
          this.errorMessage.set(err.message || 'Failed to apply adjustment.');
        },
      });
  }
}
