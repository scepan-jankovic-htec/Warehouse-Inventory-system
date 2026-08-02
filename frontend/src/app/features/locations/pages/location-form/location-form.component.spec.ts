import '@angular/compiler';
import { TestBed } from '@angular/core/testing';
import { Router, ActivatedRoute } from '@angular/router';
import { of, throwError, Subject } from 'rxjs';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { LocationFormComponent } from './location-form.component';
import { LocationService } from '../../services/location.service';
import { LocationResponse } from '../../models/location.model';
import { ApiError, FieldError } from '../../../../core/models/api-error.model';

async function setup(
  routeParams: Record<string, unknown> = {},
  loadLocationResult = of({
    data: {
      id: 1,
      name: 'Warehouse A',
      type: 'WAREHOUSE' as const,
      address: '123 Main St',
      active: true,
      createdAt: '2024-01-01',
      updatedAt: '2024-01-02'
    } as LocationResponse
  })
) {
  const locationServiceMock = {
    loadLocation: vi.fn(() => loadLocationResult),
    createLocation: vi.fn(),
    updateLocation: vi.fn()
  };

  const routerMock = {
    navigate: vi.fn()
  };

  const activatedRouteMock = {
    snapshot: {
      paramMap: {
        get: (key: string) => (routeParams[key] ? String(routeParams[key]) : null)
      }
    }
  };

  await TestBed.configureTestingModule({
    imports: [LocationFormComponent],
    providers: [
      { provide: LocationService, useValue: locationServiceMock },
      { provide: Router, useValue: routerMock },
      { provide: ActivatedRoute, useValue: activatedRouteMock }
    ]
  }).compileComponents();

  const fixture = TestBed.createComponent(LocationFormComponent);
  fixture.detectChanges();

  return {
    fixture,
    locationServiceMock,
    routerMock,
    activatedRouteMock
  };
}

describe('LocationFormComponent', () => {
  beforeEach(() => {
    TestBed.resetTestingModule();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ── Component Initialization ──────────────────────────────────────────────

  it('creates the component', async () => {
    const { fixture } = await setup();
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('initializes form with default values', async () => {
    const { fixture } = await setup();
    const comp = fixture.componentInstance;
    expect(comp.form.get('name')?.value).toBe('');
    expect(comp.form.get('type')?.value).toBeNull();
    expect(comp.form.get('address')?.value).toBe('');
  });

  it('initializes signals with default values', async () => {
    const { fixture } = await setup();
    const comp = fixture.componentInstance;
    expect(comp.isEditMode()).toBe(false);
    expect(comp.isSubmitting()).toBe(false);
    expect(comp.errorMessage()).toBe('');
  });

  it('has location types available', async () => {
    const { fixture } = await setup();
    const comp = fixture.componentInstance;
    expect(comp.locationTypes).toContain('WAREHOUSE');
    expect(comp.locationTypes).toContain('STORE');
    expect(comp.locationTypes.length).toBe(2);
  });

  // ── Create Mode ───────────────────────────────────────────────────────────

  it('does not enter edit mode when no id param', async () => {
    const { fixture } = await setup();
    const comp = fixture.componentInstance;
    expect(comp.isEditMode()).toBe(false);
  });

  it('does not call loadLocation when no id param', async () => {
    const { fixture, locationServiceMock } = await setup();
    expect(locationServiceMock.loadLocation).not.toHaveBeenCalled();
  });

  // ── Edit Mode ─────────────────────────────────────────────────────────────

  it('enters edit mode when id param is present', async () => {
    const { fixture } = await setup({ id: '5' });
    const comp = fixture.componentInstance;
    expect(comp.isEditMode()).toBe(true);
  });

  it('loads location when id param is present', async () => {
    const { fixture, locationServiceMock } = await setup({ id: '5' });
    expect(locationServiceMock.loadLocation).toHaveBeenCalledWith(5);
  });

  it('populates form with loaded location data', async () => {
    const { fixture } = await setup({ id: '5' });
    const comp = fixture.componentInstance;
    await new Promise(resolve => setTimeout(resolve, 50));
    fixture.detectChanges();
    expect(comp.form.get('name')?.value).toBe('Warehouse A');
    expect(comp.form.get('type')?.value).toBe('WAREHOUSE');
    expect(comp.form.get('address')?.value).toBe('123 Main St');
  });

  it('handles null address when loading location', async () => {
    const { fixture } = await setup(
      { id: '5' },
      of({
        data: {
          id: 5,
          name: 'Store B',
          type: 'STORE' as const,
          address: null,
          active: true,
          createdAt: '2024-01-01',
          updatedAt: '2024-01-02'
        } as LocationResponse
      })
    );
    const comp = fixture.componentInstance;
    await new Promise(resolve => setTimeout(resolve, 50));
    fixture.detectChanges();
    expect(comp.form.get('address')?.value).toBe('');
  });

  it('sets error message when location fails to load', async () => {
    const { fixture } = await setup(
      { id: '999' },
      throwError(() => ({ status: 404 }))
    );
    const comp = fixture.componentInstance;
    await new Promise(resolve => setTimeout(resolve, 50));
    expect(comp.errorMessage()).toBe('Failed to load location for editing.');
  });

  // ── Form Validation ───────────────────────────────────────────────────────

  it('form is invalid when name is empty', async () => {
    const { fixture } = await setup();
    const comp = fixture.componentInstance;
    comp.form.patchValue({ name: '', type: 'WAREHOUSE' });
    expect(comp.form.invalid).toBe(true);
  });

  it('form is invalid when name exceeds 100 characters', async () => {
    const { fixture } = await setup();
    const comp = fixture.componentInstance;
    const longName = 'a'.repeat(101);
    comp.form.patchValue({ name: longName, type: 'WAREHOUSE' });
    expect(comp.form.invalid).toBe(true);
  });

  it('form is invalid when type is null', async () => {
    const { fixture } = await setup();
    const comp = fixture.componentInstance;
    comp.form.patchValue({ name: 'Valid Name', type: null });
    expect(comp.form.invalid).toBe(true);
  });

  it('form is invalid when address exceeds 300 characters', async () => {
    const { fixture } = await setup();
    const comp = fixture.componentInstance;
    const longAddress = 'a'.repeat(301);
    comp.form.patchValue({ name: 'Valid', type: 'WAREHOUSE', address: longAddress });
    expect(comp.form.invalid).toBe(true);
  });

  it('form is valid with required fields only', async () => {
    const { fixture } = await setup();
    const comp = fixture.componentInstance;
    comp.form.patchValue({ name: 'Valid Location', type: 'WAREHOUSE' });
    expect(comp.form.valid).toBe(true);
  });

  it('form is valid with all fields filled', async () => {
    const { fixture } = await setup();
    const comp = fixture.componentInstance;
    comp.form.patchValue({
      name: 'Valid Location',
      type: 'STORE',
      address: '456 Oak Ave'
    });
    expect(comp.form.valid).toBe(true);
  });

  it('form is valid with name at max length', async () => {
    const { fixture } = await setup();
    const comp = fixture.componentInstance;
    const maxName = 'a'.repeat(100);
    comp.form.patchValue({ name: maxName, type: 'WAREHOUSE' });
    expect(comp.form.valid).toBe(true);
  });

  it('form is valid with address at max length', async () => {
    const { fixture } = await setup();
    const comp = fixture.componentInstance;
    const maxAddress = 'a'.repeat(300);
    comp.form.patchValue({ name: 'Valid', type: 'WAREHOUSE', address: maxAddress });
    expect(comp.form.valid).toBe(true);
  });

  // ── showError Method ──────────────────────────────────────────────────────

  it('showError returns false when control is not touched', async () => {
    const { fixture } = await setup();
    const comp = fixture.componentInstance;
    comp.form.patchValue({ name: '' });
    expect(comp.showError('name', 'required')).toBe(false);
  });

  it('showError returns false when control has no error', async () => {
    const { fixture } = await setup();
    const comp = fixture.componentInstance;
    comp.form.patchValue({ name: 'Valid' });
    comp.form.get('name')?.markAsTouched();
    expect(comp.showError('name', 'required')).toBe(false);
  });

  it('showError returns true when control is touched and has error', async () => {
    const { fixture } = await setup();
    const comp = fixture.componentInstance;
    comp.form.patchValue({ name: '' });
    comp.form.get('name')?.markAsTouched();
    expect(comp.showError('name', 'required')).toBe(true);
  });

  it('showError works for maxlength error', async () => {
    const { fixture } = await setup();
    const comp = fixture.componentInstance;
    comp.form.patchValue({ name: 'a'.repeat(101) });
    comp.form.get('name')?.markAsTouched();
    expect(comp.showError('name', 'maxlength')).toBe(true);
  });

  // ── addressLength Method ──────────────────────────────────────────────────

  it('addressLength returns zero for empty address', async () => {
    const { fixture } = await setup();
    const comp = fixture.componentInstance;
    comp.form.patchValue({ address: '' });
    expect(comp.addressLength()).toBe(0);
  });

  it('addressLength returns correct length for non-empty address', async () => {
    const { fixture } = await setup();
    const comp = fixture.componentInstance;
    comp.form.patchValue({ address: '123 Main Street' });
    expect(comp.addressLength()).toBe(15);
  });

  it('addressLength returns zero for null address', async () => {
    const { fixture } = await setup();
    const comp = fixture.componentInstance;
    comp.form.patchValue({ address: null });
    expect(comp.addressLength()).toBe(0);
  });

  it('addressLength updates when address changes', async () => {
    const { fixture } = await setup();
    const comp = fixture.componentInstance;
    comp.form.patchValue({ address: 'Short' });
    expect(comp.addressLength()).toBe(5);
    comp.form.patchValue({ address: 'Much longer address' });
    expect(comp.addressLength()).toBe(19);
  });

  // ── goBack Navigation ─────────────────────────────────────────────────────

  it('goBack navigates to locations', async () => {
    const { fixture, routerMock } = await setup();
    const comp = fixture.componentInstance;
    comp.goBack();
    expect(routerMock.navigate).toHaveBeenCalledWith(['/locations']);
  });

  // ── Submit in Create Mode ─────────────────────────────────────────────────

  it('submit does not call service when form is invalid', async () => {
    const { fixture, locationServiceMock } = await setup();
    const comp = fixture.componentInstance;
    comp.form.patchValue({ name: '', type: null });
    comp.submit();
    expect(locationServiceMock.createLocation).not.toHaveBeenCalled();
    expect(locationServiceMock.updateLocation).not.toHaveBeenCalled();
  });

  it('submit marks all fields as touched on invalid form', async () => {
    const { fixture } = await setup();
    const comp = fixture.componentInstance;
    comp.form.patchValue({ name: '', type: null, address: '' });
    comp.submit();
    expect(comp.form.get('name')?.touched).toBe(true);
    expect(comp.form.get('type')?.touched).toBe(true);
    expect(comp.form.get('address')?.touched).toBe(true);
  });

  it('submit clears error message at start', async () => {
    const { fixture, locationServiceMock } = await setup();
    locationServiceMock.createLocation.mockReturnValue(of({ data: {} }));
    const comp = fixture.componentInstance;
    comp.errorMessage.set('Previous error');
    comp.form.patchValue({ name: 'Valid', type: 'WAREHOUSE' });
    comp.submit();
    expect(comp.errorMessage()).toBe('');
  });

  it('submit calls createLocation with correct payload in create mode', async () => {
    const { fixture, locationServiceMock } = await setup();
    locationServiceMock.createLocation.mockReturnValue(of({ data: {} } as any));
    const comp = fixture.componentInstance;
    comp.form.patchValue({
      name: 'New Location',
      type: 'WAREHOUSE',
      address: '789 Pine Road'
    });
    comp.submit();
    expect(locationServiceMock.createLocation).toHaveBeenCalledWith({
      name: 'New Location',
      type: 'WAREHOUSE',
      address: '789 Pine Road'
    });
  });

  it('submit trims and omits empty address in create mode', async () => {
    const { fixture, locationServiceMock } = await setup();
    locationServiceMock.createLocation.mockReturnValue(of({ data: {} } as any));
    const comp = fixture.componentInstance;
    comp.form.patchValue({
      name: 'New Location',
      type: 'WAREHOUSE',
      address: '   '
    });
    comp.submit();
    expect(locationServiceMock.createLocation).toHaveBeenCalledWith(
      expect.objectContaining({
        address: undefined
      })
    );
  });

  it('submit trims whitespace from name in create mode', async () => {
    const { fixture, locationServiceMock } = await setup();
    locationServiceMock.createLocation.mockReturnValue(of({ data: {} } as any));
    const comp = fixture.componentInstance;
    comp.form.patchValue({
      name: '  Trimmed Name  ',
      type: 'STORE',
      address: '  123 Main  '
    });
    comp.submit();
    expect(locationServiceMock.createLocation).toHaveBeenCalledWith({
      name: 'Trimmed Name',
      type: 'STORE',
      address: '123 Main'
    });
  });

  it('submit navigates to locations on create success', async () => {
    const { fixture, locationServiceMock, routerMock } = await setup();
    locationServiceMock.createLocation.mockReturnValue(of({ data: {} } as any));
    const comp = fixture.componentInstance;
    comp.form.patchValue({ name: 'Valid', type: 'WAREHOUSE' });
    comp.submit();
    expect(routerMock.navigate).toHaveBeenCalledWith(['/locations']);
  });

  it('submit does not call updateLocation in create mode', async () => {
    const { fixture, locationServiceMock } = await setup();
    locationServiceMock.createLocation.mockReturnValue(of({ data: {} } as any));
    const comp = fixture.componentInstance;
    comp.form.patchValue({ name: 'Valid', type: 'WAREHOUSE' });
    comp.submit();
    expect(locationServiceMock.updateLocation).not.toHaveBeenCalled();
  });

  // ── Submit in Edit Mode ───────────────────────────────────────────────────

  it('submit calls updateLocation with correct payload in edit mode', async () => {
    const { fixture, locationServiceMock } = await setup({ id: '5' });
    locationServiceMock.updateLocation.mockReturnValue(of({ data: {} } as any));
    const comp = fixture.componentInstance;
    await new Promise(resolve => setTimeout(resolve, 50));
    fixture.detectChanges();
    comp.form.patchValue({
      name: 'Updated Location',
      type: 'STORE',
      address: '999 Updated Ave'
    });
    comp.submit();
    expect(locationServiceMock.updateLocation).toHaveBeenCalledWith(5, {
      name: 'Updated Location',
      type: 'STORE',
      address: '999 Updated Ave'
    });
  });

  it('submit trims and omits empty address in edit mode', async () => {
    const { fixture, locationServiceMock } = await setup({ id: '5' });
    locationServiceMock.updateLocation.mockReturnValue(of({ data: {} } as any));
    const comp = fixture.componentInstance;
    await new Promise(resolve => setTimeout(resolve, 50));
    fixture.detectChanges();
    comp.form.patchValue({
      name: 'Updated',
      type: 'WAREHOUSE',
      address: '   '
    });
    comp.submit();
    expect(locationServiceMock.updateLocation).toHaveBeenCalledWith(
      5,
      expect.objectContaining({
        address: undefined
      })
    );
  });

  it('submit navigates to locations on update success', async () => {
    const { fixture, locationServiceMock, routerMock } = await setup({ id: '5' });
    locationServiceMock.updateLocation.mockReturnValue(of({ data: {} } as any));
    const comp = fixture.componentInstance;
    await new Promise(resolve => setTimeout(resolve, 50));
    fixture.detectChanges();
    comp.form.patchValue({ name: 'Updated', type: 'WAREHOUSE' });
    comp.submit();
    expect(routerMock.navigate).toHaveBeenCalledWith(['/locations']);
  });

  it('submit does not call createLocation in edit mode', async () => {
    const { fixture, locationServiceMock } = await setup({ id: '5' });
    locationServiceMock.updateLocation.mockReturnValue(of({ data: {} } as any));
    const comp = fixture.componentInstance;
    await new Promise(resolve => setTimeout(resolve, 50));
    fixture.detectChanges();
    comp.form.patchValue({ name: 'Updated', type: 'WAREHOUSE' });
    comp.submit();
    expect(locationServiceMock.createLocation).not.toHaveBeenCalled();
  });

  // ── Error Handling ────────────────────────────────────────────────────────

  it('handles 409 conflict error by setting name field error', async () => {
    const { fixture, locationServiceMock } = await setup();
    locationServiceMock.createLocation.mockReturnValue(
      throwError(() => ({ status: 409, message: 'Conflict' }))
    );
    const comp = fixture.componentInstance;
    comp.form.patchValue({ name: 'Duplicate', type: 'WAREHOUSE' });
    comp.submit();
    await new Promise(resolve => setTimeout(resolve, 50));
    expect(comp.form.get('name')?.hasError('duplicate')).toBe(true);
    expect(comp.form.get('name')?.touched).toBe(true);
    expect(comp.isSubmitting()).toBe(false);
  });

  it('handles fieldErrors from server by setting control errors', async () => {
    const { fixture, locationServiceMock } = await setup();
    const fieldErrors: FieldError[] = [
      { field: 'name', message: 'Name already exists' },
      { field: 'address', message: 'Invalid address format' }
    ];
    locationServiceMock.createLocation.mockReturnValue(
      throwError(() => ({ status: 422, fieldErrors }))
    );
    const comp = fixture.componentInstance;
    comp.form.patchValue({ name: 'Invalid', type: 'WAREHOUSE', address: 'Bad' });
    comp.submit();
    await new Promise(resolve => setTimeout(resolve, 50));
    expect(comp.form.get('name')?.hasError('server')).toBe(true);
    expect(comp.form.get('address')?.hasError('server')).toBe(true);
    expect(comp.form.get('name')?.touched).toBe(true);
  });

  it('ignores fieldErrors for non-existent controls', async () => {
    const { fixture, locationServiceMock } = await setup();
    const fieldErrors: FieldError[] = [
      { field: 'name', message: 'Name error' },
      { field: 'nonExistent', message: 'This field does not exist' }
    ];
    locationServiceMock.createLocation.mockReturnValue(
      throwError(() => ({ status: 422, fieldErrors }))
    );
    const comp = fixture.componentInstance;
    comp.form.patchValue({ name: 'Invalid', type: 'WAREHOUSE' });
    comp.submit();
    await new Promise(resolve => setTimeout(resolve, 50));
    expect(comp.form.get('name')?.hasError('server')).toBe(true);
    // Should not throw error for nonExistent field
    expect(comp.form.get('nonExistent')).toBeNull();
  });

  it('sets error message when error has no fieldErrors', async () => {
    const { fixture, locationServiceMock } = await setup();
    locationServiceMock.createLocation.mockReturnValue(
      throwError(() => ({ status: 500, message: 'Server error occurred' }))
    );
    const comp = fixture.componentInstance;
    comp.form.patchValue({ name: 'Valid', type: 'WAREHOUSE' });
    comp.submit();
    await new Promise(resolve => setTimeout(resolve, 50));
    expect(comp.errorMessage()).toBe('Server error occurred');
    expect(comp.isSubmitting()).toBe(false);
  });

  it('falls back to generic message when error has no message', async () => {
    const { fixture, locationServiceMock } = await setup();
    locationServiceMock.createLocation.mockReturnValue(
      throwError(() => ({ status: 500 }))
    );
    const comp = fixture.componentInstance;
    comp.form.patchValue({ name: 'Valid', type: 'WAREHOUSE' });
    comp.submit();
    await new Promise(resolve => setTimeout(resolve, 50));
    expect(comp.errorMessage()).toBe('Failed to save location.');
    expect(comp.isSubmitting()).toBe(false);
  });

  it('handles missing locationId in edit mode gracefully', async () => {
    const { fixture } = await setup();
    const comp = fixture.componentInstance;
    // Force edit mode with null locationId (shouldn't happen in normal flow)
    comp.isEditMode.set(true);
    comp.form.patchValue({ name: 'Updated', type: 'WAREHOUSE' });
    comp.submit();
    await new Promise(resolve => setTimeout(resolve, 50));
    expect(comp.errorMessage()).toBe('Invalid location id.');
    expect(comp.isSubmitting()).toBe(false);
  });

  // ── Edge Cases ────────────────────────────────────────────────────────────

  it('handles empty string for address in form submission', async () => {
    const { fixture, locationServiceMock } = await setup();
    locationServiceMock.createLocation.mockReturnValue(of({ data: {} } as any));
    const comp = fixture.componentInstance;
    comp.form.patchValue({
      name: 'No Address',
      type: 'WAREHOUSE',
      address: ''
    });
    comp.submit();
    expect(locationServiceMock.createLocation).toHaveBeenCalledWith(
      expect.objectContaining({
        address: undefined
      })
    );
  });

  it('sets isSubmitting to true during request', async () => {
    const { fixture, locationServiceMock } = await setup();
    const subject = new Subject();
    locationServiceMock.createLocation.mockReturnValue(subject.asObservable());
    const comp = fixture.componentInstance;
    comp.form.patchValue({ name: 'Valid', type: 'WAREHOUSE' });
    comp.submit();
    expect(comp.isSubmitting()).toBe(true);
  });

  it('handles all WAREHOUSE and STORE type options', async () => {
    const { fixture } = await setup();
    const comp = fixture.componentInstance;
    comp.form.patchValue({ name: 'Test', type: 'WAREHOUSE' });
    expect(comp.form.valid).toBe(true);
    comp.form.patchValue({ type: 'STORE' });
    expect(comp.form.valid).toBe(true);
  });

  it('preserves form state on failed submission', async () => {
    const { fixture, locationServiceMock } = await setup();
    locationServiceMock.createLocation.mockReturnValue(
      throwError(() => ({ status: 500, message: 'Error' }))
    );
    const comp = fixture.componentInstance;
    comp.form.patchValue({
      name: 'Test Location',
      type: 'WAREHOUSE',
      address: '123 Test St'
    });
    comp.submit();
    await new Promise(resolve => setTimeout(resolve, 50));
    expect(comp.form.get('name')?.value).toBe('Test Location');
    expect(comp.form.get('type')?.value).toBe('WAREHOUSE');
    expect(comp.form.get('address')?.value).toBe('123 Test St');
  });

  it('does not navigate on submission error', async () => {
    const { fixture, locationServiceMock, routerMock } = await setup();
    locationServiceMock.createLocation.mockReturnValue(
      throwError(() => ({ status: 500, message: 'Error' }))
    );
    const comp = fixture.componentInstance;
    comp.form.patchValue({ name: 'Valid', type: 'WAREHOUSE' });
    comp.submit();
    await new Promise(resolve => setTimeout(resolve, 50));
    expect(routerMock.navigate).not.toHaveBeenCalled();
  });
});
