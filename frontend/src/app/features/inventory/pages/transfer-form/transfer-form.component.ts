import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, signal } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ProductResponse } from '../../../products/models/product.model';
import { LocationResponse } from '../../../locations/models/location.model';
import { InventoryService } from '../../services/inventory.service';

function differentLocationsValidator(control: AbstractControl): ValidationErrors | null {
  const source = control.get('sourceLocationId')?.value;
  const destination = control.get('destinationLocationId')?.value;
  if (source && destination && Number(source) === Number(destination)) {
    return { sameLocation: true };
  }
  return null;
}

@Component({
  selector: 'app-transfer-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './transfer-form.component.html',
  styleUrls: ['./transfer-form.component.scss'],
})
export class TransferFormComponent implements OnInit {
  readonly products = signal<ProductResponse[]>([]);
  readonly locations = signal<LocationResponse[]>([]);
  readonly sourceCurrentQuantity = signal(0);
  readonly destinationCurrentQuantity = signal(0);
  readonly isSubmitting = signal(false);
  readonly errorMessage = signal('');

  readonly form;

  readonly sourceProjectedQuantity = computed(() => {
    const quantity = Number(this.form.controls.quantity.value ?? 0);
    return this.sourceCurrentQuantity() - Math.max(quantity, 0);
  });

  constructor(
    private readonly formBuilder: FormBuilder,
    private readonly router: Router,
    private readonly inventoryService: InventoryService
  ) {
    this.form = this.formBuilder.group(
      {
        productId: [null as number | null, [Validators.required]],
        sourceLocationId: [null as number | null, [Validators.required]],
        destinationLocationId: [null as number | null, [Validators.required]],
        quantity: [1, [Validators.required, Validators.min(1)]],
        referenceId: ['', [Validators.maxLength(100)]],
        reason: ['', [Validators.maxLength(500)]],
      },
      { validators: [differentLocationsValidator] }
    );
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

  refreshQuantities(): void {
    this.refreshSourceQuantity();
    this.refreshDestinationQuantity();
  }

  goBack(): void {
    this.router.navigate(['/inventory']);
  }

  submit(): void {
    this.form.updateValueAndValidity();

    const requested = Number(this.form.controls.quantity.value ?? 0);
    if (requested > this.sourceCurrentQuantity()) {
      this.form.setErrors({ ...(this.form.errors ?? {}), insufficientClientStock: true });
    } else if (this.form.hasError('insufficientClientStock')) {
      const existingErrors = { ...(this.form.errors ?? {}) };
      delete existingErrors['insufficientClientStock'];
      this.form.setErrors(Object.keys(existingErrors).length ? existingErrors : null);
    }

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set('');

    this.inventoryService
      .transfer({
        productId: Number(this.form.controls.productId.value),
        sourceLocationId: Number(this.form.controls.sourceLocationId.value),
        destinationLocationId: Number(this.form.controls.destinationLocationId.value),
        quantity: requested,
        referenceId: (this.form.controls.referenceId.value ?? '').trim() || undefined,
        reason: (this.form.controls.reason.value ?? '').trim() || undefined,
      })
      .subscribe({
        next: () => this.router.navigate(['/inventory']),
        error: (err: { status?: number; message?: string }) => {
          this.isSubmitting.set(false);
          if (err.status === 422) {
            this.errorMessage.set('Insufficient stock or inactive resources.');
            return;
          }
          this.errorMessage.set(err.message || 'Failed to transfer stock.');
        },
      });
  }

  private refreshSourceQuantity(): void {
    const productId = Number(this.form.controls.productId.value);
    const sourceId = Number(this.form.controls.sourceLocationId.value);

    if (!productId || !sourceId) {
      this.sourceCurrentQuantity.set(0);
      return;
    }

    this.inventoryService.getInventoryByProductAndLocation(productId, sourceId).subscribe({
      next: (res) => this.sourceCurrentQuantity.set(res.data.quantityOnHand),
      error: () => this.sourceCurrentQuantity.set(0),
    });
  }

  private refreshDestinationQuantity(): void {
    const productId = Number(this.form.controls.productId.value);
    const destinationId = Number(this.form.controls.destinationLocationId.value);

    if (!productId || !destinationId) {
      this.destinationCurrentQuantity.set(0);
      return;
    }

    this.inventoryService.getInventoryByProductAndLocation(productId, destinationId).subscribe({
      next: (res) => this.destinationCurrentQuantity.set(res.data.quantityOnHand),
      error: () => this.destinationCurrentQuantity.set(0),
    });
  }
}
