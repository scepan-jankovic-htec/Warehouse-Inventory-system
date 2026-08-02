import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { CategoryService } from '../../services/category.service';
import { CategoryResponse } from '../../models/category.model';

@Component({
  selector: 'app-category-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="form-container">
      <div class="form-header">
        <h1>{{ isEditMode() ? 'Edit Category' : 'New Category' }}</h1>
        <button class="btn btn-secondary" (click)="cancel()">
          ← Back
        </button>
      </div>

      <form [formGroup]="form" (ngSubmit)="onSubmit()" class="form">
        <!-- Name Field -->
        <div class="form-group">
          <label for="name" class="form-label">
            Category Name <span class="required">*</span>
          </label>
          <input
            id="name"
            type="text"
            formControlName="name"
            class="form-control"
            placeholder="e.g., Beverages"
            maxlength="100"
          />
          <div
            *ngIf="name.touched && name.invalid"
            class="error-message"
          >
            <span *ngIf="name.errors?.['required']">Name is required</span>
            <span *ngIf="name.errors?.['minlength']">Name must be at least 1 character</span>
            <span *ngIf="name.errors?.['maxlength']">Name cannot exceed 100 characters</span>
            <span *ngIf="name.errors?.['duplicate']">This name is already in use</span>
          </div>
        </div>

        <!-- Description Field -->
        <div class="form-group">
          <label for="description" class="form-label">
            Description <span class="optional">(optional)</span>
          </label>
          <textarea
            id="description"
            formControlName="description"
            class="form-control form-textarea"
            placeholder="e.g., All drinkable products"
            rows="4"
            maxlength="500"
          ></textarea>
          <div class="char-count">
            {{ (description.value?.length || 0) }} / 500
          </div>
          <div
            *ngIf="description.touched && description.invalid"
            class="error-message"
          >
            <span *ngIf="description.errors?.['maxlength']">Description cannot exceed 500 characters</span>
          </div>
        </div>

        <!-- Form Actions -->
        <div class="form-actions">
          <button type="button" class="btn btn-secondary" (click)="cancel()">
            Cancel
          </button>
          <button
            type="submit"
            class="btn btn-primary"
            [disabled]="form.invalid || isSubmitting()"
          >
            {{ isSubmitting() ? '⏳ Saving...' : (isEditMode() ? '✅ Update' : '✅ Create') }}
          </button>
        </div>

        <!-- Form Errors -->
        <div *ngIf="formError()" class="error-banner">
          ❌ {{ formError() }}
        </div>

        <!-- Success Message -->
        <div *ngIf="successMessage()" class="success-banner">
          ✅ {{ successMessage() }}
        </div>
      </form>
    </div>
  `,
  styles: `
    .form-container {
      max-width: 600px;
      margin: 0 auto;
      padding: 24px;
    }

    .form-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 32px;
      border-bottom: 1px solid #e0e0e0;
      padding-bottom: 16px;
    }

    .form-header h1 {
      margin: 0;
      font-size: 24px;
      font-weight: 600;
      color: #333;
    }

    .form {
      background: white;
      padding: 24px;
      border-radius: 8px;
      border: 1px solid #e0e0e0;
    }

    .form-group {
      margin-bottom: 24px;
    }

    .form-label {
      display: block;
      margin-bottom: 8px;
      font-weight: 500;
      color: #333;
      font-size: 14px;
    }

    .required {
      color: #c62828;
      font-weight: 600;
    }

    .optional {
      color: #999;
      font-weight: normal;
      font-size: 13px;
    }

    .form-control {
      width: 100%;
      padding: 10px 12px;
      border: 1px solid #ddd;
      border-radius: 4px;
      font-size: 14px;
      font-family: inherit;
      transition: border-color 0.2s;
      box-sizing: border-box;
    }

    .form-control:focus {
      outline: none;
      border-color: #2196F3;
      box-shadow: 0 0 0 2px rgba(33, 150, 243, 0.1);
    }

    .form-control.error {
      border-color: #c62828;
      background: #ffebee;
    }

    .form-textarea {
      resize: vertical;
      min-height: 100px;
    }

    .char-count {
      display: block;
      margin-top: 4px;
      font-size: 12px;
      color: #999;
      text-align: right;
    }

    .error-message {
      color: #c62828;
      font-size: 12px;
      margin-top: 4px;
      display: block;
    }

    .error-banner {
      background: #ffebee;
      color: #c62828;
      padding: 12px 16px;
      border-radius: 4px;
      margin-top: 16px;
      border-left: 4px solid #c62828;
      font-size: 14px;
    }

    .success-banner {
      background: #e8f5e9;
      color: #2e7d32;
      padding: 12px 16px;
      border-radius: 4px;
      margin-top: 16px;
      border-left: 4px solid #4caf50;
      font-size: 14px;
    }

    .form-actions {
      display: flex;
      gap: 12px;
      justify-content: flex-end;
      margin-top: 32px;
      padding-top: 24px;
      border-top: 1px solid #e0e0e0;
    }

    .btn {
      padding: 10px 20px;
      border: none;
      border-radius: 4px;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }

    .btn:hover {
      transform: translateY(-1px);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }

    .btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
      transform: none;
    }

    .btn-primary {
      background: #2196F3;
      color: white;
    }

    .btn-primary:hover:not(:disabled) {
      background: #1976D2;
    }

    .btn-secondary {
      background: #f5f5f5;
      color: #333;
      border: 1px solid #ddd;
    }

    .btn-secondary:hover:not(:disabled) {
      background: #ececec;
    }
  `
})
export class CategoryFormComponent implements OnInit {
  form: FormGroup;
  isEditMode = signal(false);
  isSubmitting = signal(false);
  formError = signal('');
  successMessage = signal('');

  private categoryId: number | null = null;

  get name() {
    return this.form.get('name')!;
  }

  get description() {
    return this.form.get('description')!;
  }

  constructor(
    private formBuilder: FormBuilder,
    private categoryService: CategoryService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.form = this.formBuilder.group({
      name: ['', [Validators.required, Validators.maxLength(100)]],
      description: ['', [Validators.maxLength(500)]]
    });
  }

  ngOnInit() {
    // Check if we're in edit mode
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.categoryId = Number(params['id']);
        this.isEditMode.set(true);
        this.loadCategory(this.categoryId);
      }
    });
  }

  private loadCategory(id: number) {
    this.categoryService.loadCategory(id).subscribe({
      next: (res) => {
        const category = res.data;
        this.form.patchValue({
          name: category.name,
          description: category.description || ''
        });
      },
      error: (err) => {
        this.formError.set('Failed to load category');
        console.error('Error loading category:', err);
        setTimeout(() => this.router.navigate(['/categories']), 2000);
      }
    });
  }

  onSubmit() {
    if (this.form.invalid) {
      return;
    }

    this.isSubmitting.set(true);
    this.formError.set('');
    this.successMessage.set('');

    const formValue = this.form.value;

    if (this.isEditMode() && this.categoryId) {
      // Update operation
      this.categoryService.updateCategory(this.categoryId, formValue).subscribe({
        next: () => {
          this.successMessage.set('Category updated successfully');
          setTimeout(() => {
            this.router.navigate(['/categories']);
          }, 1500);
        },
        error: (err) => {
          this.isSubmitting.set(false);
          if (err.status === 409) {
            this.formError.set('This category name is already in use');
          } else if (err.status === 404) {
            this.formError.set('Category not found');
          } else {
            this.formError.set('Failed to update category. Please try again.');
          }
          console.error('Error updating category:', err);
        }
      });
    } else {
      // Create operation
      this.categoryService.createCategory(formValue).subscribe({
        next: () => {
          this.successMessage.set('Category created successfully');
          setTimeout(() => {
            this.router.navigate(['/categories']);
          }, 1500);
        },
        error: (err) => {
          this.isSubmitting.set(false);
          if (err.status === 409) {
            this.formError.set('This category name is already in use');
          } else {
            this.formError.set('Failed to create category. Please try again.');
          }
          console.error('Error creating category:', err);
        }
      });
    }
  }

  cancel() {
    this.router.navigate(['/categories']);
  }
}
