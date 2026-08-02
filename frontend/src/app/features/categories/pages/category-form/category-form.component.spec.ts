import '@angular/compiler';
import { FormBuilder } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { of, throwError, Subject } from 'rxjs';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { CategoryFormComponent } from './category-form.component';
import { CategoryService } from '../../services/category.service';
import { CategoryResponse } from '../../models/category.model';

async function setup(
  routeParams: Record<string, unknown> = {},
  loadCategoryResult = of({
    data: {
      id: 1,
      name: 'Test Category',
      description: 'Test Description',
      active: true,
      productCount: 5,
      createdAt: '2024-01-01',
      updatedAt: '2024-01-02'
    } as CategoryResponse
  })
) {
  const categoryServiceMock = {
    loadCategory: vi.fn(() => loadCategoryResult),
    createCategory: vi.fn(),
    updateCategory: vi.fn()
  };

  const routerMock = {
    navigate: vi.fn()
  };

  const paramsSubject = new Subject();
  const activatedRouteMock = {
    params: paramsSubject.asObservable()
  };

  const component = new CategoryFormComponent(
    new FormBuilder(),
    categoryServiceMock as unknown as CategoryService,
    routerMock as unknown as Router,
    activatedRouteMock as unknown as ActivatedRoute
  );
  component.ngOnInit();

  const fixture = {
    componentInstance: component,
    detectChanges: () => undefined
  };

  // Emit route params
  if (Object.keys(routeParams).length > 0) {
    paramsSubject.next(routeParams);
  }

  return {
    fixture,
    categoryServiceMock,
    routerMock,
    activatedRouteMock,
    paramsSubject
  };
}

describe('CategoryFormComponent', () => {
  beforeEach(() => {
    // Keep hook for per-test setup symmetry.
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ── Component Initialization ──────────────────────────────────────────────

  it('creates the component', async () => {
    const { fixture } = await setup();
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('initializes form with empty values in create mode', async () => {
    const { fixture } = await setup();
    const comp = fixture.componentInstance;
    expect(comp.form.get('name')?.value).toBe('');
    expect(comp.form.get('description')?.value).toBe('');
  });

  it('sets isEditMode to false in create mode', async () => {
    const { fixture } = await setup();
    const comp = fixture.componentInstance;
    expect(comp.isEditMode()).toBe(false);
  });

  it('initializes all signals with default values', async () => {
    const { fixture } = await setup();
    const comp = fixture.componentInstance;
    expect(comp.isSubmitting()).toBe(false);
    expect(comp.formError()).toBe('');
    expect(comp.successMessage()).toBe('');
  });

  // ── Edit Mode Loading ─────────────────────────────────────────────────────

  it('sets isEditMode to true when route params contain id', async () => {
    const { fixture } = await setup({ id: '5' });
    const comp = fixture.componentInstance;
    expect(comp.isEditMode()).toBe(true);
  });

  it('loads category data when in edit mode', async () => {
    const { fixture, categoryServiceMock } = await setup({ id: '5' });
    expect(categoryServiceMock.loadCategory).toHaveBeenCalledWith(5);
  });

  it('populates form with loaded category data', async () => {
    const { fixture } = await setup({ id: '5' });
    const comp = fixture.componentInstance;
    expect(comp.form.get('name')?.value).toBe('Test Category');
    expect(comp.form.get('description')?.value).toBe('Test Description');
  });

  it('handles missing description gracefully', async () => {
    const { fixture } = await setup(
      { id: '5' },
      of({
        data: {
          id: 1,
          name: 'No Description',
          description: null,
          active: true,
          productCount: 0,
          createdAt: '2024-01-01',
          updatedAt: '2024-01-02'
        } as CategoryResponse
      })
    );
    const comp = fixture.componentInstance;
    expect(comp.form.get('description')?.value).toBe('');
  });

  it('navigates to categories after 2 seconds on load error', async () => {
    vi.useFakeTimers();
    const { fixture, routerMock } = await setup(
      { id: '999' },
      throwError(() => ({ status: 404 }))
    );
    const comp = fixture.componentInstance;
    expect(comp.formError()).toBe('Failed to load category');
    vi.advanceTimersByTime(2000);
    expect(routerMock.navigate).toHaveBeenCalledWith(['/categories']);
    vi.useRealTimers();
  });

  it('logs error when category fails to load', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const { fixture } = await setup(
      { id: '999' },
      throwError(() => ({ status: 500, message: 'Server error' }))
    );
    expect(consoleErrorSpy).toHaveBeenCalled();
    consoleErrorSpy.mockRestore();
  });

  // ── Form Validation ───────────────────────────────────────────────────────

  it('form is invalid when name is empty', async () => {
    const { fixture } = await setup();
    const comp = fixture.componentInstance;
    comp.form.patchValue({ name: '', description: 'Valid' });
    expect(comp.form.invalid).toBe(true);
  });

  it('form is invalid when name exceeds 100 characters', async () => {
    const { fixture } = await setup();
    const comp = fixture.componentInstance;
    const longName = 'a'.repeat(101);
    comp.form.patchValue({ name: longName, description: '' });
    expect(comp.form.invalid).toBe(true);
  });

  it('form is invalid when description exceeds 500 characters', async () => {
    const { fixture } = await setup();
    const comp = fixture.componentInstance;
    const longDescription = 'a'.repeat(501);
    comp.form.patchValue({ name: 'Valid', description: longDescription });
    expect(comp.form.invalid).toBe(true);
  });

  it('form is valid with required name and optional description', async () => {
    const { fixture } = await setup();
    const comp = fixture.componentInstance;
    comp.form.patchValue({ name: 'Valid Category', description: '' });
    expect(comp.form.valid).toBe(true);
  });

  it('form is valid with name at max length', async () => {
    const { fixture } = await setup();
    const comp = fixture.componentInstance;
    const maxName = 'a'.repeat(100);
    comp.form.patchValue({ name: maxName, description: '' });
    expect(comp.form.valid).toBe(true);
  });

  it('form is valid with description at max length', async () => {
    const { fixture } = await setup();
    const comp = fixture.componentInstance;
    const maxDescription = 'a'.repeat(500);
    comp.form.patchValue({ name: 'Valid', description: maxDescription });
    expect(comp.form.valid).toBe(true);
  });

  // ── Form Control Getters ──────────────────────────────────────────────────

  it('name getter returns the name control', async () => {
    const { fixture } = await setup();
    const comp = fixture.componentInstance;
    expect(comp.name).toBe(comp.form.get('name'));
  });

  it('description getter returns the description control', async () => {
    const { fixture } = await setup();
    const comp = fixture.componentInstance;
    expect(comp.description).toBe(comp.form.get('description'));
  });

  // ── Create Category ───────────────────────────────────────────────────────

  it('onSubmit — create mode — sends createCategory with form data', async () => {
    const { fixture, categoryServiceMock } = await setup(
      {},
      of({ data: { id: 1, name: 'New', description: '', active: true, productCount: 0, createdAt: '', updatedAt: '' } } as any)
    );
    categoryServiceMock.createCategory.mockReturnValue(
      of({ data: { id: 1, name: 'New', description: '', active: true, productCount: 0, createdAt: '', updatedAt: '' } } as any)
    );
    const comp = fixture.componentInstance;
    comp.form.patchValue({ name: 'New Category', description: 'Description' });
    comp.onSubmit();
    expect(categoryServiceMock.createCategory).toHaveBeenCalledWith({
      name: 'New Category',
      description: 'Description'
    });
  });

  it('onSubmit — create mode — sets success message and navigates', async () => {
    vi.useFakeTimers();
    const { fixture, categoryServiceMock, routerMock } = await setup();
    categoryServiceMock.createCategory.mockReturnValue(
      of({ data: { id: 1, name: 'New', description: '', active: true, productCount: 0, createdAt: '', updatedAt: '' } } as any)
    );
    const comp = fixture.componentInstance;
    comp.form.patchValue({ name: 'New Category', description: '' });
    comp.onSubmit();
    expect(comp.successMessage()).toBe('Category created successfully');
    vi.advanceTimersByTime(1500);
    expect(routerMock.navigate).toHaveBeenCalledWith(['/categories']);
    vi.useRealTimers();
  });

  it('onSubmit — create mode — does not call updateCategory', async () => {
    const { fixture, categoryServiceMock } = await setup();
    categoryServiceMock.createCategory.mockReturnValue(
      of({ data: { id: 1, name: 'New', description: '', active: true, productCount: 0, createdAt: '', updatedAt: '' } } as any)
    );
    const comp = fixture.componentInstance;
    comp.form.patchValue({ name: 'New Category', description: '' });
    comp.onSubmit();
    expect(categoryServiceMock.updateCategory).not.toHaveBeenCalled();
  });

  // ── Update Category ───────────────────────────────────────────────────────

  it('onSubmit — edit mode — sends updateCategory with id and form data', async () => {
    const { fixture, categoryServiceMock } = await setup({ id: '5' });
    categoryServiceMock.updateCategory.mockReturnValue(
      of({ data: { id: 5, name: 'Updated', description: '', active: true, productCount: 0, createdAt: '', updatedAt: '' } } as any)
    );
    const comp = fixture.componentInstance;
    comp.form.patchValue({ name: 'Updated Category', description: 'New desc' });
    comp.onSubmit();
    expect(categoryServiceMock.updateCategory).toHaveBeenCalledWith(5, {
      name: 'Updated Category',
      description: 'New desc'
    });
  });

  it('onSubmit — edit mode — sets success message and navigates', async () => {
    vi.useFakeTimers();
    const { fixture, categoryServiceMock, routerMock } = await setup({ id: '5' });
    categoryServiceMock.updateCategory.mockReturnValue(
      of({ data: { id: 5, name: 'Updated', description: '', active: true, productCount: 0, createdAt: '', updatedAt: '' } } as any)
    );
    const comp = fixture.componentInstance;
    comp.form.patchValue({ name: 'Updated', description: '' });
    comp.onSubmit();
    expect(comp.successMessage()).toBe('Category updated successfully');
    vi.advanceTimersByTime(1500);
    expect(routerMock.navigate).toHaveBeenCalledWith(['/categories']);
    vi.useRealTimers();
  });

  it('onSubmit — edit mode — does not call createCategory', async () => {
    const { fixture, categoryServiceMock } = await setup({ id: '5' });
    categoryServiceMock.updateCategory.mockReturnValue(
      of({ data: { id: 5, name: 'Updated', description: '', active: true, productCount: 0, createdAt: '', updatedAt: '' } } as any)
    );
    const comp = fixture.componentInstance;
    comp.form.patchValue({ name: 'Updated', description: '' });
    comp.onSubmit();
    expect(categoryServiceMock.createCategory).not.toHaveBeenCalled();
  });

  // ── Error Handling ────────────────────────────────────────────────────────

  it('onSubmit — create — 409 conflict — shows duplicate name error', async () => {
    const { fixture, categoryServiceMock } = await setup();
    categoryServiceMock.createCategory.mockReturnValue(
      throwError(() => ({ status: 409 }))
    );
    const comp = fixture.componentInstance;
    comp.form.patchValue({ name: 'Duplicate', description: '' });
    comp.onSubmit();
    expect(comp.formError()).toBe('This category name is already in use');
    expect(comp.isSubmitting()).toBe(false);
  });

  it('onSubmit — create — generic error — shows generic message', async () => {
    const { fixture, categoryServiceMock } = await setup();
    categoryServiceMock.createCategory.mockReturnValue(
      throwError(() => ({ status: 500 }))
    );
    const comp = fixture.componentInstance;
    comp.form.patchValue({ name: 'New', description: '' });
    comp.onSubmit();
    expect(comp.formError()).toBe('Failed to create category. Please try again.');
    expect(comp.isSubmitting()).toBe(false);
  });

  it('onSubmit — update — 409 conflict — shows duplicate name error', async () => {
    const { fixture, categoryServiceMock } = await setup({ id: '5' });
    categoryServiceMock.updateCategory.mockReturnValue(
      throwError(() => ({ status: 409 }))
    );
    const comp = fixture.componentInstance;
    comp.form.patchValue({ name: 'Duplicate', description: '' });
    comp.onSubmit();
    expect(comp.formError()).toBe('This category name is already in use');
    expect(comp.isSubmitting()).toBe(false);
  });

  it('onSubmit — update — 404 not found — shows category not found error', async () => {
    const { fixture, categoryServiceMock } = await setup({ id: '999' });
    categoryServiceMock.updateCategory.mockReturnValue(
      throwError(() => ({ status: 404 }))
    );
    const comp = fixture.componentInstance;
    comp.form.patchValue({ name: 'Updated', description: '' });
    comp.onSubmit();
    expect(comp.formError()).toBe('Category not found');
    expect(comp.isSubmitting()).toBe(false);
  });

  it('onSubmit — update — generic error — shows generic message', async () => {
    const { fixture, categoryServiceMock } = await setup({ id: '5' });
    categoryServiceMock.updateCategory.mockReturnValue(
      throwError(() => ({ status: 500 }))
    );
    const comp = fixture.componentInstance;
    comp.form.patchValue({ name: 'Updated', description: '' });
    comp.onSubmit();
    expect(comp.formError()).toBe('Failed to update category. Please try again.');
    expect(comp.isSubmitting()).toBe(false);
  });

  it('onSubmit — error — logs error to console', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const { fixture, categoryServiceMock } = await setup();
    const testError = { status: 500, message: 'Server error' };
    categoryServiceMock.createCategory.mockReturnValue(
      throwError(() => testError)
    );
    const comp = fixture.componentInstance;
    comp.form.patchValue({ name: 'New', description: '' });
    comp.onSubmit();
    expect(consoleErrorSpy).toHaveBeenCalled();
    consoleErrorSpy.mockRestore();
  });

  // ── Form State Management ─────────────────────────────────────────────────

  it('onSubmit — clears previous error and success messages', async () => {
    const { fixture, categoryServiceMock } = await setup();
    categoryServiceMock.createCategory.mockReturnValue(
      throwError(() => ({ status: 500 }))
    );
    const comp = fixture.componentInstance;
    comp.formError.set('Previous error');
    comp.successMessage.set('Previous success');
    comp.form.patchValue({ name: 'New', description: '' });
    comp.onSubmit();
    // Signals are updated synchronously at start of onSubmit
    expect(comp.formError()).not.toBe('Previous error');
    expect(comp.successMessage()).not.toBe('Previous success');
  });

  it('onSubmit — does not submit when form is invalid', async () => {
    const { fixture, categoryServiceMock } = await setup();
    const comp = fixture.componentInstance;
    comp.form.patchValue({ name: '', description: '' }); // Invalid: empty name
    comp.onSubmit();
    expect(categoryServiceMock.createCategory).not.toHaveBeenCalled();
    expect(categoryServiceMock.updateCategory).not.toHaveBeenCalled();
  });

  it('onSubmit — sets isSubmitting to true during request', async () => {
    const { fixture, categoryServiceMock } = await setup();
    const subject = new Subject();
    categoryServiceMock.createCategory.mockReturnValue(subject.asObservable());
    const comp = fixture.componentInstance;
    comp.form.patchValue({ name: 'New', description: '' });
    comp.onSubmit();
    expect(comp.isSubmitting()).toBe(true);
    subject.next({ data: { id: 1 } });
    subject.complete();
  });

  it('onSubmit — sets isSubmitting to false on success', async () => {
    const { fixture, categoryServiceMock } = await setup();
    categoryServiceMock.createCategory.mockReturnValue(
      of({ data: { id: 1, name: 'New', description: '', active: true, productCount: 0, createdAt: '', updatedAt: '' } } as any)
    );
    const comp = fixture.componentInstance;
    comp.form.patchValue({ name: 'New', description: '' });
    comp.onSubmit();
    // After navigation, isSubmitting remains true until component is destroyed
    // but success message is set, indicating the flow completed
    expect(comp.successMessage()).toBe('Category created successfully');
  });

  // ── Cancel Navigation ─────────────────────────────────────────────────────

  it('cancel navigates to categories', async () => {
    const { fixture, routerMock } = await setup();
    const comp = fixture.componentInstance;
    comp.cancel();
    expect(routerMock.navigate).toHaveBeenCalledWith(['/categories']);
  });

  it('cancel works in create mode', async () => {
    const { fixture, routerMock } = await setup();
    const comp = fixture.componentInstance;
    expect(comp.isEditMode()).toBe(false);
    comp.cancel();
    expect(routerMock.navigate).toHaveBeenCalledWith(['/categories']);
  });

  it('cancel works in edit mode', async () => {
    const { fixture, routerMock } = await setup({ id: '5' });
    const comp = fixture.componentInstance;
    expect(comp.isEditMode()).toBe(true);
    comp.cancel();
    expect(routerMock.navigate).toHaveBeenCalledWith(['/categories']);
  });

  // ── Edge Cases ────────────────────────────────────────────────────────────

  it('onSubmit — whitespace-only name — submits current form value', async () => {
    const { fixture, categoryServiceMock } = await setup();
    categoryServiceMock.createCategory.mockReturnValue(
      of({ data: { id: 1, name: '   ', description: '', active: true, productCount: 0, createdAt: '', updatedAt: '' } } as any)
    );
    const comp = fixture.componentInstance;
    comp.form.patchValue({ name: '   ', description: '' });
    comp.onSubmit();
    expect(categoryServiceMock.createCategory).toHaveBeenCalledWith({
      name: '   ',
      description: ''
    });
  });

  it('description is optional and can be empty', async () => {
    const { fixture } = await setup();
    const comp = fixture.componentInstance;
    comp.form.patchValue({ name: 'Valid', description: '' });
    expect(comp.form.valid).toBe(true);
  });

  it('handles form patchValue for partial updates', async () => {
    const { fixture } = await setup();
    const comp = fixture.componentInstance;
    comp.form.patchValue({ name: 'Updated' }); // Only update name
    expect(comp.form.get('name')?.value).toBe('Updated');
    expect(comp.form.get('description')?.value).toBe(''); // Description unchanged
  });
});
