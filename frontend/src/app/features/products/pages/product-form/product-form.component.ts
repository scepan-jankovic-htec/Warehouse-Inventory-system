import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiError } from '../../../../core/models/api-error.model';
import { CategoryService } from '../../../categories/services/category.service';
import { ProductCreateRequest, ProductUpdateRequest } from '../../models/product.model';
import { ProductService } from '../../services/product.service';

@Component({
  selector: 'app-product-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './product-form.component.html',
  styleUrls: ['./product-form.component.scss'],
})
export class ProductFormComponent implements OnInit {
  readonly isEditMode = signal(false);
  readonly isSubmitting = signal(false);
  readonly errorMessage = signal('');
  readonly categories = computed(() => this.categoryService.activeCategories());

  readonly form;

  private productId: number | null = null;

  constructor(
    private readonly formBuilder: FormBuilder,
    private readonly route: ActivatedRoute,
    public readonly router: Router,
    private readonly productService: ProductService,
    private readonly categoryService: CategoryService
  ) {
    this.form = this.formBuilder.group({
      sku: [
        '',
        [
          Validators.required,
          Validators.maxLength(50),
          Validators.pattern(/^[A-Z0-9-]+$/),
        ],
      ],
      name: ['', [Validators.required, Validators.maxLength(200)]],
      description: ['', [Validators.maxLength(1000)]],
      categoryId: [null as number | null, [Validators.required]],
      unitOfMeasure: ['', [Validators.required, Validators.maxLength(20)]],
      reorderThreshold: [0, [Validators.min(0)]],
    });
  }

  ngOnInit(): void {
    this.categoryService
      .loadCategories({ active: true, sortBy: 'name', sortDir: 'asc', page: 1, size: 200 })
      .subscribe({ error: () => undefined });

    const idParam = this.route.snapshot.paramMap.get('id');
    if (!idParam) {
      return;
    }

    this.productId = Number(idParam);
    this.isEditMode.set(true);
    this.form.controls.sku.disable();

    this.productService.loadProduct(this.productId).subscribe({
      next: (res) => {
        this.form.patchValue({
          sku: res.data.sku,
          name: res.data.name,
          description: res.data.description ?? '',
          categoryId: res.data.category.id,
          unitOfMeasure: res.data.unitOfMeasure,
          reorderThreshold: res.data.reorderThreshold,
        });
      },
      error: () => this.errorMessage.set('Failed to load product for editing.'),
    });
  }

  showError(controlName: keyof typeof this.form.controls, errorName: string): boolean {
    const control = this.form.controls[controlName];
    return !!(control.touched && control.hasError(errorName));
  }

  normalizeSku(): void {
    const control = this.form.controls.sku;
    const value = control.value ?? '';
    const normalized = value.toUpperCase();
    if (value !== normalized) {
      control.setValue(normalized, { emitEvent: false });
    }
  }

  descriptionLength(): number {
    return this.form.controls.description.value?.length ?? 0;
  }

  goBack(): void {
    this.router.navigate(['/products']);
  }

  resetForm(): void {
    this.form.reset({
      sku: '',
      name: '',
      description: '',
      categoryId: null,
      unitOfMeasure: '',
      reorderThreshold: 0,
    });
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
    const payload: ProductCreateRequest = {
      sku: (this.form.controls.sku.value ?? '').trim(),
      name: (this.form.controls.name.value ?? '').trim(),
      description: (this.form.controls.description.value ?? '').trim() || undefined,
      categoryId: Number(this.form.controls.categoryId.value),
      unitOfMeasure: (this.form.controls.unitOfMeasure.value ?? '').trim(),
      reorderThreshold: Number(this.form.controls.reorderThreshold.value ?? 0),
    };

    this.productService.createProduct(payload).subscribe({
      next: (res) => this.router.navigate(['/products', res.data.id]),
      error: (err) => this.handleApiError(err),
    });
  }

  private update(): void {
    if (!this.productId) {
      this.handleApiError({ message: 'Invalid product id.' });
      return;
    }

    const payload: ProductUpdateRequest = {
      name: (this.form.controls.name.value ?? '').trim(),
      description: (this.form.controls.description.value ?? '').trim() || undefined,
      categoryId: Number(this.form.controls.categoryId.value),
      unitOfMeasure: (this.form.controls.unitOfMeasure.value ?? '').trim(),
      reorderThreshold: Number(this.form.controls.reorderThreshold.value ?? 0),
    };

    this.productService.updateProduct(this.productId, payload).subscribe({
      next: (res) => this.router.navigate(['/products', res.data.id]),
      error: (err) => this.handleApiError(err),
    });
  }

  private handleApiError(error: unknown): void {
    this.isSubmitting.set(false);

    const apiError = error as Partial<ApiError> & { status?: number };

    if (apiError.status === 409) {
      this.form.controls.sku.setErrors({ duplicate: true });
      this.form.controls.sku.markAsTouched();
      return;
    }

    if (apiError.status === 422) {
      this.form.controls.categoryId.setErrors({ inactiveCategory: true });
      this.form.controls.categoryId.markAsTouched();
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

    this.errorMessage.set(apiError.message || 'Unable to save product.');
  }
}
