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
  templateUrl: './adjustment-form.component.html',
  styleUrls: ['./adjustment-form.component.scss'],
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
