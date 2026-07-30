import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterTestingModule } from '@angular/router/testing';
import { RegisterComponent } from '../register.component';
import { AuthService } from '../../../../core/services/auth.service';
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('RegisterComponent', () => {
  let component: RegisterComponent;
  let fixture: ComponentFixture<RegisterComponent>;
  let authServiceMock: any;

  beforeEach(async () => {
    authServiceMock = {
      register: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [ReactiveFormsModule, RouterTestingModule, RegisterComponent],
      providers: [
        { provide: AuthService, useValue: authServiceMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(RegisterComponent);
    component = fixture.componentInstance;
  });

  describe('Form Initialization', () => {
    it('should create the component', () => {
      expect(component).toBeTruthy();
    });

    it('should initialize form with correct default values', () => {
      const form = component.registerForm;
      expect(form.get('name')?.value).toBe('');
      expect(form.get('agencyName')?.value).toBe('');
      expect(form.get('email')?.value).toBe('');
      expect(form.get('password')?.value).toBe('');
      expect(form.get('confirmPassword')?.value).toBe('');
    });

    it('should have form pristine and untouched initially', () => {
      const form = component.registerForm;
      expect(form.pristine).toBe(true);
      expect(form.touched).toBe(false);
    });
  });

  describe('Form Validation - Name', () => {
    it('should be invalid when name is empty', () => {
      component.registerForm.get('name')?.setValue('');
      expect(component.registerForm.get('name')?.valid).toBe(false);
    });

    it('should be invalid when name is less than 2 characters', () => {
      component.registerForm.get('name')?.setValue('A');
      expect(component.registerForm.get('name')?.valid).toBe(false);
    });

    it('should be valid when name is 2 or more characters', () => {
      component.registerForm.get('name')?.setValue('AB');
      expect(component.registerForm.get('name')?.valid).toBe(true);
    });

    it('should be valid when name is long', () => {
      component.registerForm.get('name')?.setValue('John Doe');
      expect(component.registerForm.get('name')?.valid).toBe(true);
    });
  });

  describe('Form Validation - Agency Name', () => {
    it('should be invalid when agency name is empty', () => {
      component.registerForm.get('agencyName')?.setValue('');
      expect(component.registerForm.get('agencyName')?.valid).toBe(false);
    });

    it('should be invalid when agency name is less than 2 characters', () => {
      component.registerForm.get('agencyName')?.setValue('A');
      expect(component.registerForm.get('agencyName')?.valid).toBe(false);
    });

    it('should be valid when agency name is 2 or more characters', () => {
      component.registerForm.get('agencyName')?.setValue('AB');
      expect(component.registerForm.get('agencyName')?.valid).toBe(true);
    });
  });

  describe('Form Validation - Email', () => {
    it('should be invalid when email is empty', () => {
      component.registerForm.get('email')?.setValue('');
      expect(component.registerForm.get('email')?.valid).toBe(false);
    });

    it('should be invalid when email format is incorrect', () => {
      component.registerForm.get('email')?.setValue('not-an-email');
      expect(component.registerForm.get('email')?.valid).toBe(false);
    });

    it('should be valid when email format is correct', () => {
      component.registerForm.get('email')?.setValue('test@example.com');
      expect(component.registerForm.get('email')?.valid).toBe(true);
    });
  });

  describe('Form Validation - Password', () => {
    it('should be invalid when password is empty', () => {
      component.registerForm.get('password')?.setValue('');
      expect(component.registerForm.get('password')?.valid).toBe(false);
    });

    it('should be invalid when password is less than 8 characters', () => {
      component.registerForm.get('password')?.setValue('short');
      expect(component.registerForm.get('password')?.valid).toBe(false);
    });

    it('should be valid when password is 8 or more characters', () => {
      component.registerForm.get('password')?.setValue('12345678');
      expect(component.registerForm.get('password')?.valid).toBe(true);
    });
  });

  describe('Form Validation - Confirm Password', () => {
    it('should be invalid when confirm password is empty', () => {
      component.registerForm.get('confirmPassword')?.setValue('');
      expect(component.registerForm.get('confirmPassword')?.valid).toBe(false);
    });

    it('should be valid when confirm password has any value', () => {
      component.registerForm.get('confirmPassword')?.setValue('anything');
      expect(component.registerForm.get('confirmPassword')?.valid).toBe(true);
    });
  });

  describe('Password Match Validator', () => {
    it('should have passwordMismatch error when passwords do not match', () => {
      component.registerForm.setValue({
        name: 'Test User',
        agencyName: 'Test Agency',
        email: 'test@example.com',
        password: 'password123',
        confirmPassword: 'different123',
      });

      expect(component.registerForm.hasError('passwordMismatch')).toBe(true);
    });

    it('should not have passwordMismatch error when passwords match', () => {
      component.registerForm.setValue({
        name: 'Test User',
        agencyName: 'Test Agency',
        email: 'test@example.com',
        password: 'password123',
        confirmPassword: 'password123',
      });

      expect(component.registerForm.hasError('passwordMismatch')).toBe(false);
    });

    it('should not have passwordMismatch error when both are empty', () => {
      component.registerForm.setValue({
        name: 'Test User',
        agencyName: 'Test Agency',
        email: 'test@example.com',
        password: '',
        confirmPassword: '',
      });

      expect(component.registerForm.hasError('passwordMismatch')).toBe(false);
    });
  });

  describe('onSubmit()', () => {
    it('should not submit when form is invalid', async () => {
      await component.onSubmit();
      expect(authServiceMock.register).not.toHaveBeenCalled();
    });

    it('should mark all fields as touched when form is invalid', async () => {
      await component.onSubmit();
      expect(component.registerForm.get('name')?.touched).toBe(true);
      expect(component.registerForm.get('agencyName')?.touched).toBe(true);
      expect(component.registerForm.get('email')?.touched).toBe(true);
      expect(component.registerForm.get('password')?.touched).toBe(true);
      expect(component.registerForm.get('confirmPassword')?.touched).toBe(true);
    });

    it('should submit valid form data to AuthService', async () => {
      authServiceMock.register.mockResolvedValue({});

      component.registerForm.setValue({
        name: 'Test User',
        agencyName: 'Test Agency',
        email: 'test@example.com',
        password: 'password123',
        confirmPassword: 'password123',
      });

      await component.onSubmit();

      expect(authServiceMock.register).toHaveBeenCalledWith({
        name: 'Test User',
        agencyName: 'Test Agency',
        email: 'test@example.com',
        password: 'password123',
      });
    });

    it('should not include confirmPassword in register call', async () => {
      authServiceMock.register.mockResolvedValue({});

      component.registerForm.setValue({
        name: 'Test User',
        agencyName: 'Test Agency',
        email: 'test@example.com',
        password: 'password123',
        confirmPassword: 'password123',
      });

      await component.onSubmit();

      const callArg = authServiceMock.register.mock.calls[0][0];
      expect(callArg).not.toHaveProperty('confirmPassword');
    });

    it('should set loading to true during submission', async () => {
      authServiceMock.register.mockImplementation(() => {
        expect(component.loading()).toBe(true);
        return Promise.resolve({});
      });

      component.registerForm.setValue({
        name: 'Test User',
        agencyName: 'Test Agency',
        email: 'test@example.com',
        password: 'password123',
        confirmPassword: 'password123',
      });

      await component.onSubmit();
    });

    it('should set error message on API failure', async () => {
      authServiceMock.register.mockRejectedValue({
        error: { message: 'Email already registered' },
      });

      component.registerForm.setValue({
        name: 'Test User',
        agencyName: 'Test Agency',
        email: 'test@example.com',
        password: 'password123',
        confirmPassword: 'password123',
      });

      await component.onSubmit();

      expect(component.error()).toBe('Email already registered');
    });

    it('should set default error message when no error message provided', async () => {
      authServiceMock.register.mockRejectedValue({});

      component.registerForm.setValue({
        name: 'Test User',
        agencyName: 'Test Agency',
        email: 'test@example.com',
        password: 'password123',
        confirmPassword: 'password123',
      });

      await component.onSubmit();

      expect(component.error()).toBe('Registration failed. Please try again.');
    });

    it('should reset loading to false after submission completes', async () => {
      authServiceMock.register.mockResolvedValue({});

      component.registerForm.setValue({
        name: 'Test User',
        agencyName: 'Test Agency',
        email: 'test@example.com',
        password: 'password123',
        confirmPassword: 'password123',
      });

      await component.onSubmit();

      expect(component.loading()).toBe(false);
    });
  });

  describe('togglePasswordVisibility()', () => {
    it('should toggle showPassword signal', () => {
      expect(component.showPassword()).toBe(false);
      component.togglePasswordVisibility();
      expect(component.showPassword()).toBe(true);
      component.togglePasswordVisibility();
      expect(component.showPassword()).toBe(false);
    });
  });

  describe('toggleConfirmPasswordVisibility()', () => {
    it('should toggle showConfirmPassword signal', () => {
      expect(component.showConfirmPassword()).toBe(false);
      component.toggleConfirmPasswordVisibility();
      expect(component.showConfirmPassword()).toBe(true);
      component.toggleConfirmPasswordVisibility();
      expect(component.showConfirmPassword()).toBe(false);
    });
  });
});
