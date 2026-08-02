import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ProductResponse } from '../../../products/models/product.model';
import { LocationResponse } from '../../../locations/models/location.model';
import { InventoryService } from '../../services/inventory.service';

@Component({
  selector: 'app-receive-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './receive-form.component.html',
  styleUrls: ['./receive-form.component.scss'],
})
export class ReceiveFormComponent implements OnInit {
  readonly products = signal<ProductResponse[]>([]);
  readonly locations = signal<LocationResponse[]>([]);
  readonly currentQuantity = signal(0);
  readonly isSubmitting = signal(false);
  readonly errorMessage = signal('');

  readonly form;
  readonly quantityValue = signal<number | null>(1);

  readonly projectedQuantity = computed(() => {
    const quantity = Number(this.quantityValue() ?? 0);
    return this.currentQuantity() + Math.max(quantity, 0);
  });

  constructor(
    private readonly formBuilder: FormBuilder,
    private readonly router: Router,
    private readonly inventoryService: InventoryService
  ) {
    this.form = this.formBuilder.group({
      productId: [null as number | null, [Validators.required]],
      locationId: [null as number | null, [Validators.required]],
      quantity: [1, [Validators.required, Validators.min(1)]],
      referenceId: ['', [Validators.maxLength(100)]],
      reason: ['', [Validators.maxLength(500)]],
    });
    this.quantityValue.set(this.form.controls.quantity.value);
    this.form.controls.quantity.valueChanges.subscribe((value) => {
      this.quantityValue.set(value);
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
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set('');

    this.inventoryService
      .receive({
        productId: Number(this.form.controls.productId.value),
        locationId: Number(this.form.controls.locationId.value),
        quantity: Number(this.form.controls.quantity.value),
        referenceId: (this.form.controls.referenceId.value ?? '').trim() || undefined,
        reason: (this.form.controls.reason.value ?? '').trim() || undefined,
      })
      .subscribe({
        next: () => this.router.navigate(['/inventory']),
        error: (err: { status?: number; message?: string } | null | undefined) => {
          this.isSubmitting.set(false);
          if (err?.status === 422) {
            this.errorMessage.set('Product or location is inactive.');
            return;
          }
          this.errorMessage.set(err?.message || 'Failed to increase stock.');
        },
      });
  }
}
