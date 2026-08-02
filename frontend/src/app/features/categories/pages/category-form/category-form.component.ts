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
  templateUrl: './category-form.component.html',
  styleUrls: ['./category-form.component.scss'],
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
