import '@angular/compiler';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideRouter } from '@angular/router';
import { describe, expect, it } from 'vitest';
import { LoginComponent } from './login.component';

function setup() {
  const fixture = TestBed.configureTestingModule({
    imports: [LoginComponent],
    providers: [
      provideHttpClient(),
      provideHttpClientTesting(),
      provideAnimationsAsync(),
      provideRouter([])
    ]
  }).createComponent(LoginComponent);
  fixture.detectChanges();
  return fixture;
}

describe('LoginComponent', () => {
  it('creates the component', () => {
    const fixture = setup();
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('form is invalid when empty', () => {
    const fixture = setup();
    expect(fixture.componentInstance.form.invalid).toBe(true);
  });

  it('form is valid when username and password are filled', () => {
    const fixture = setup();
    const comp = fixture.componentInstance;
    comp.form.setValue({ username: 'admin', password: 'secret' });
    expect(comp.form.valid).toBe(true);
  });

  it('marks fields as touched on submit with empty form', () => {
    const fixture = setup();
    const comp = fixture.componentInstance;
    comp.onSubmit();
    expect(comp.form.controls.username.touched).toBe(true);
    expect(comp.form.controls.password.touched).toBe(true);
  });

  it('togglePassword flips hidePassword signal', () => {
    const fixture = setup();
    const comp = fixture.componentInstance;
    expect(comp.hidePassword()).toBe(true);
    comp.togglePassword();
    expect(comp.hidePassword()).toBe(false);
  });
});
