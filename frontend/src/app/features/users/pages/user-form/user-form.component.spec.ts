import '@angular/compiler';
import { FormBuilder, Validators } from '@angular/forms';
import { describe, expect, it, vi } from 'vitest';
import { ApiError } from '../../../../core/models/api-error.model';
import { UserRole } from '../../../../core/models/api-enums.model';
import { UserFormComponent } from './user-form.component';

interface UserFormHarness {
  route: { snapshot: { paramMap: { get: (key: string) => string | null } } };
  router: { navigate: ReturnType<typeof vi.fn> };
  userService: {
    loadUser: ReturnType<typeof vi.fn>;
    createUser: ReturnType<typeof vi.fn>;
    updateUser: ReturnType<typeof vi.fn>;
  };
  form: ReturnType<FormBuilder['group']>;
  roleOptions: UserRole[];
  isEditMode: (() => boolean) & { set: (value: boolean) => void };
  isSubmitting: (() => boolean) & { set: (value: boolean) => void };
  errorMessage: (() => string) & { set: (value: string) => void };
  ngOnInit: () => void;
  showError: (controlName: keyof ReturnType<FormBuilder['group']>['controls'], errorName: string) => boolean;
  goBack: () => void;
  submit: () => void;
}

function createComponent(
  routeId?: string,
  loadUserResult?: { data: { id: number; username: string; fullName: string; email: string; role: UserRole } } | Error
) {
  const routerMock = {
    navigate: vi.fn(),
  };

  const userServiceMock = {
    loadUser: vi.fn(() => {
      if (loadUserResult instanceof Error) {
        return {
          subscribe: (handlers: { next?: () => void; error?: () => void }) => {
            handlers.error?.();
            return { unsubscribe: vi.fn() };
          },
        } as never;
      }

      return {
        subscribe: (handlers: {
          next?: (value: { data: { id: number; username: string; fullName: string; email: string; role: UserRole } }) => void;
          error?: () => void;
        }) => {
          if (loadUserResult) {
            handlers.next?.(loadUserResult);
          }
          return { unsubscribe: vi.fn() };
        },
      } as never;
    }),
    createUser: vi.fn(),
    updateUser: vi.fn(),
  };

  const component = Object.create(UserFormComponent.prototype) as UserFormHarness;

  component.route = {
    snapshot: {
      paramMap: {
        get: (key: string) => (key === 'id' && routeId !== undefined ? routeId : null),
      },
    },
  };
  component.router = routerMock;
  component.userService = userServiceMock;
  component.roleOptions = ['ADMIN', 'WAREHOUSE_OPERATOR', 'STORE_OPERATOR', 'MANAGER'];
  let isEditModeValue = false;
  let isSubmittingValue = false;
  let errorMessageValue = '';
  component.isEditMode = (() => isEditModeValue) as UserFormHarness['isEditMode'];
  component.isSubmitting = (() => isSubmittingValue) as UserFormHarness['isSubmitting'];
  component.errorMessage = (() => errorMessageValue) as UserFormHarness['errorMessage'];
  component.isEditMode.set = (value: boolean) => {
    isEditModeValue = value;
  };
  component.isSubmitting.set = (value: boolean) => {
    isSubmittingValue = value;
  };
  component.errorMessage.set = (value: string) => {
    errorMessageValue = value;
  };
  component.form = new FormBuilder().group({
    username: ['', [Validators.required, Validators.maxLength(50)]],
    password: ['', [Validators.required, Validators.minLength(8)]],
    fullName: ['', [Validators.required, Validators.maxLength(100)]],
    email: ['', [Validators.required, Validators.email, Validators.maxLength(255)]],
    role: [null, [Validators.required]],
  }) as never;

  if (routeId !== undefined) {
    component.ngOnInit();
  }

  return { component, routerMock, userServiceMock };
}

function successSubscription() {
  return {
    subscribe: (handlers: { next?: () => void }) => {
      handlers.next?.();
      return { unsubscribe: vi.fn() };
    },
  } as never;
}

function errorSubscription(error: unknown) {
  return {
    subscribe: (handlers: { error?: (value: unknown) => void }) => {
      handlers.error?.(error);
      return { unsubscribe: vi.fn() };
    },
  } as never;
}

describe('UserFormComponent', () => {
  it('creates component with default state', () => {
    const { component } = createComponent();

    expect(component.form.controls['username'].value).toBe('');
    expect(component.form.controls['password'].value).toBe('');
    expect(component.isEditMode()).toBe(false);
    expect(component.isSubmitting()).toBe(false);
    expect(component.errorMessage()).toBe('');
    expect(component.roleOptions).toEqual(['ADMIN', 'WAREHOUSE_OPERATOR', 'STORE_OPERATOR', 'MANAGER']);
  });

  it('create mode keeps username enabled and requires password', () => {
    const { component, userServiceMock } = createComponent();

    expect(component.form.controls['username'].disabled).toBe(false);
    expect(userServiceMock.loadUser).not.toHaveBeenCalled();
    expect(component.form.controls['password'].enabled).toBe(true);
  });

  it('edit mode disables username and clears password validators', () => {
    const { component, userServiceMock } = createComponent('5', {
      data: {
        id: 5,
        username: 'jdoe',
        fullName: 'John Doe',
        email: 'john.doe@example.com',
        role: 'WAREHOUSE_OPERATOR',
      },
    });

    expect(component.isEditMode()).toBe(true);
    expect(userServiceMock.loadUser).toHaveBeenCalledWith(5);
    expect(component.form.controls['username'].disabled).toBe(true);
    expect(component.form.controls['password'].validator).toBeNull();
  });

  it('edit mode loads user data into form', () => {
    const { component } = createComponent('5', {
      data: {
        id: 5,
        username: 'jdoe',
        fullName: 'John Doe',
        email: 'john.doe@example.com',
        role: 'WAREHOUSE_OPERATOR',
      },
    });

    expect(component.form.controls['username'].value).toBe('jdoe');
    expect(component.form.controls['fullName'].value).toBe('John Doe');
    expect(component.form.controls['email'].value).toBe('john.doe@example.com');
    expect(component.form.controls['role'].value).toBe('WAREHOUSE_OPERATOR');
  });

  it('edit mode load error sets error message', () => {
    const { component } = createComponent('5', new Error('not found'));

    expect(component.errorMessage()).toBe('Failed to load user for editing.');
  });

  it('showError returns true only for touched control with matching error', () => {
    const { component } = createComponent();

    component.form.controls['email'].setErrors({ email: true });
    expect(component.showError('email', 'email')).toBe(false);
    component.form.controls['email'].markAsTouched();
    expect(component.showError('email', 'email')).toBe(true);
    expect(component.showError('email', 'required')).toBe(false);
  });

  it('goBack navigates to users list', () => {
    const { component, routerMock } = createComponent();

    component.goBack();

    expect(routerMock.navigate).toHaveBeenCalledWith(['/users']);
  });

  it('submit invalid form marks fields touched and does not call services', () => {
    const { component, userServiceMock } = createComponent();

    component.submit();

    expect(component.form.controls['username'].touched).toBe(true);
    expect(component.form.controls['password'].touched).toBe(true);
    expect(component.form.controls['fullName'].touched).toBe(true);
    expect(component.form.controls['email'].touched).toBe(true);
    expect(component.form.controls['role'].touched).toBe(true);
    expect(userServiceMock.createUser).not.toHaveBeenCalled();
    expect(userServiceMock.updateUser).not.toHaveBeenCalled();
  });

  it('submit create mode sends trimmed payload and navigates on success', () => {
    const { component, routerMock, userServiceMock } = createComponent();
    userServiceMock.createUser.mockReturnValue(successSubscription());

    component.form.patchValue({
      username: '  jdoe  ',
      password: 'TemporaryPass1!',
      fullName: '  John Doe  ',
      email: '  john.doe@example.com  ',
      role: 'WAREHOUSE_OPERATOR',
    });

    (component as unknown as { create: () => void }).create();

    expect(userServiceMock.createUser).toHaveBeenCalledWith({
      username: 'jdoe',
      password: 'TemporaryPass1!',
      fullName: 'John Doe',
      email: 'john.doe@example.com',
      role: 'WAREHOUSE_OPERATOR',
    });
    expect(routerMock.navigate).toHaveBeenCalledWith(['/users']);
    expect(userServiceMock.updateUser).not.toHaveBeenCalled();
  });

  it('submit edit mode sends update payload and navigates on success', () => {
    const { component, routerMock, userServiceMock } = createComponent('5', {
      data: {
        id: 5,
        username: 'jdoe',
        fullName: 'John Doe',
        email: 'john.doe@example.com',
        role: 'WAREHOUSE_OPERATOR',
      },
    });
    userServiceMock.updateUser.mockReturnValue(successSubscription());

    component.form.patchValue({
      fullName: '  Jane Doe  ',
      email: '  jane.doe@example.com  ',
      role: 'MANAGER',
    });

    (component as unknown as { update: () => void }).update();

    expect(userServiceMock.updateUser).toHaveBeenCalledWith(5, {
      fullName: 'Jane Doe',
      email: 'jane.doe@example.com',
      role: 'MANAGER',
    });
    expect(routerMock.navigate).toHaveBeenCalledWith(['/users']);
    expect(userServiceMock.createUser).not.toHaveBeenCalled();
  });

  it('submit edit mode with invalid user id shows message and skips update call', () => {
    const { component, userServiceMock } = createComponent('0', {
      data: {
        id: 0,
        username: 'jdoe',
        fullName: 'John Doe',
        email: 'john.doe@example.com',
        role: 'WAREHOUSE_OPERATOR',
      },
    });

    component.form.patchValue({
      fullName: 'Jane Doe',
      email: 'jane.doe@example.com',
      role: 'MANAGER',
    });

    component.submit();

    expect(component.errorMessage()).toBe('Invalid user id.');
    expect(userServiceMock.updateUser).not.toHaveBeenCalled();
  });

  it('create duplicate 409 maps duplicate errors to username/email controls', () => {
    const { component, userServiceMock } = createComponent();
    const duplicateError: ApiError = {
      status: 409,
      error: 'Conflict',
      message: 'Duplicate user',
      timestamp: '2026-08-02T00:00:00Z',
      fieldErrors: [
        { field: 'username', message: 'Username already exists' },
        { field: 'email', message: 'Email already exists' },
      ],
    };

    userServiceMock.createUser.mockReturnValue(errorSubscription(duplicateError));
    component.form.patchValue({
      username: 'jdoe',
      password: 'TemporaryPass1!',
      fullName: 'John Doe',
      email: 'john.doe@example.com',
      role: 'WAREHOUSE_OPERATOR',
    });

    component.submit();

    expect(component.form.controls['username'].hasError('duplicate')).toBe(true);
    expect(component.form.controls['email'].hasError('duplicate')).toBe(true);
    expect(component.form.controls['username'].touched).toBe(true);
    expect(component.form.controls['email'].touched).toBe(true);
  });

  it('create validation fieldErrors map server messages to controls', () => {
    const { component, userServiceMock } = createComponent();
    const validationError: ApiError = {
      status: 400,
      error: 'Bad Request',
      message: 'Validation failed',
      timestamp: '2026-08-02T00:00:00Z',
      fieldErrors: [{ field: 'fullName', message: 'Full name is required' }],
    };

    userServiceMock.createUser.mockReturnValue(errorSubscription(validationError));
    component.form.patchValue({
      username: 'jdoe',
      password: 'TemporaryPass1!',
      fullName: 'John Doe',
      email: 'john.doe@example.com',
      role: 'WAREHOUSE_OPERATOR',
    });

    component.submit();

    expect(component.form.controls['fullName'].errors).toEqual({ server: 'Full name is required' });
    expect(component.form.controls['fullName'].touched).toBe(true);
  });

  it('unknown API error sets fallback message', () => {
    const { component, userServiceMock } = createComponent();

    userServiceMock.createUser.mockReturnValue(errorSubscription({ status: 500 }));
    component.form.patchValue({
      username: 'jdoe',
      password: 'TemporaryPass1!',
      fullName: 'John Doe',
      email: 'john.doe@example.com',
      role: 'WAREHOUSE_OPERATOR',
    });

    component.submit();

    expect(component.errorMessage()).toBe('Failed to save user.');
  });
});
