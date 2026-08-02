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
  template: `
    <section class="page">
      <header class="header">
        <h1>{{ isEditMode() ? 'Edit Product' : 'New Product' }}</h1>
        <button type="button" class="btn" (click)="goBack()">← Back</button>
      </header>

      <form class="form" [formGroup]="form" (ngSubmit)="submit()">
        <div class="grid">
          <div class="field">
            <label for="sku">SKU *</label>
            <input
              id="sku"
              type="text"
              formControlName="sku"
              maxlength="50"
              (input)="normalizeSku()"
              placeholder="BAT-AA-4P"
            />
            <small *ngIf="showError('sku', 'required')">SKU is required.</small>
            <small *ngIf="showError('sku', 'maxlength')">SKU must be at most 50 characters.</small>
            <small *ngIf="showError('sku', 'pattern')">SKU must be uppercase letters, numbers, or hyphen.</small>
            <small *ngIf="showError('sku', 'duplicate')">This SKU already exists.</small>
          </div>

          <div class="field">
            <label for="name">Name *</label>
            <input id="name" type="text" formControlName="name" maxlength="200" placeholder="AA Battery 4-Pack" />
            <small *ngIf="showError('name', 'required')">Name is required.</small>
            <small *ngIf="showError('name', 'maxlength')">Name must be at most 200 characters.</small>
          </div>

          <div class="field full-width">
            <label for="description">Description</label>
            <textarea id="description" rows="4" formControlName="description" maxlength="1000"></textarea>
            <div class="char-counter">{{ descriptionLength() }} / 1000</div>
            <small *ngIf="showError('description', 'maxlength')">Description must be at most 1000 characters.</small>
          </div>

          <div class="field">
            <label for="categoryId">Category *</label>
            <select id="categoryId" formControlName="categoryId">
              <option [ngValue]="null">Select a category</option>
              <option *ngFor="let category of categories()" [ngValue]="category.id">{{ category.name }}</option>
            </select>
            <small *ngIf="showError('categoryId', 'required')">Category is required.</small>
            <small *ngIf="showError('categoryId', 'inactiveCategory')">Selected category is inactive.</small>
          </div>

          <div class="field">
            <label for="unitOfMeasure">Unit of measure *</label>
            <input id="unitOfMeasure" type="text" formControlName="unitOfMeasure" maxlength="20" placeholder="PACK" />
            <small *ngIf="showError('unitOfMeasure', 'required')">Unit of measure is required.</small>
            <small *ngIf="showError('unitOfMeasure', 'maxlength')">Unit of measure must be at most 20 characters.</small>
          </div>

          <div class="field">
            <label for="reorderThreshold">Reorder threshold</label>
            <input id="reorderThreshold" type="number" min="0" formControlName="reorderThreshold" />
            <small *ngIf="showError('reorderThreshold', 'min')">Reorder threshold must be 0 or greater.</small>
          </div>
        </div>

        <div class="actions">
          <button type="button" class="btn" (click)="goBack()">Cancel</button>
          <button class="btn btn-primary" type="submit" [disabled]="form.invalid || isSubmitting()">
            {{ isSubmitting() ? 'Saving...' : isEditMode() ? 'Update Product' : 'Create Product' }}
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
    }

    h1 {
      margin: 0;
      font-size: 24px;
      color: #0f172a;
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
