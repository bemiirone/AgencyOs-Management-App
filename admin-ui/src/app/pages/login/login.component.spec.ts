import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { of, throwError } from 'rxjs';
import { LoginComponent } from './login.component';
import { AuthService } from '../../services/auth.service';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;
  let authServiceMock: any;
  let routerMock: any;
  let snackBarMock: any;

  beforeEach(async () => {
    authServiceMock = {
      login: vi.fn(),
    };
    routerMock = {
      navigate: vi.fn(),
    };
    snackBarMock = {
      open: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [LoginComponent, MatSnackBarModule, NoopAnimationsModule],
      providers: [
        { provide: AuthService, useValue: authServiceMock },
        { provide: Router, useValue: routerMock },
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    })
    .overrideComponent(LoginComponent, {
      set: {
        providers: [
          { provide: MatSnackBar, useValue: snackBarMock },
        ],
      },
    })
    .compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
  });

  describe('Initialization', () => {
    it('should create the component', () => {
      expect(component).toBeTruthy();
    });

    it('should initialize with empty email and password', () => {
      expect(component.email).toBe('');
      expect(component.password).toBe('');
      expect(component.isLoading).toBe(false);
    });
  });

  describe('login()', () => {
    it('should show error when email is empty', () => {
      component.email = '';
      component.password = 'password123';
      component.login();
      expect(snackBarMock.open).toHaveBeenCalledWith('Please fill in all fields', 'Close', { duration: 3000 });
    });

    it('should show error when password is empty', () => {
      component.email = 'admin@test.com';
      component.password = '';
      component.login();
      expect(snackBarMock.open).toHaveBeenCalledWith('Please fill in all fields', 'Close', { duration: 3000 });
    });

    it('should show error when both fields are empty', () => {
      component.login();
      expect(snackBarMock.open).toHaveBeenCalledWith('Please fill in all fields', 'Close', { duration: 3000 });
    });

    it('should set isLoading to true when submitting', () => {
      component.email = 'admin@test.com';
      component.password = 'password123';
      authServiceMock.login.mockImplementation(() => of({}));
      component.login();
      expect(component.isLoading).toBe(true);
    });

    it('should navigate to /tenants on successful login', () => {
      component.email = 'admin@test.com';
      component.password = 'password123';
      authServiceMock.login.mockImplementation(() => of({ accessToken: 'token', admin: {} }));
      component.login();
      expect(routerMock.navigate).toHaveBeenCalledWith(['/tenants']);
    });

    it('should show error message on login failure', () => {
      component.email = 'admin@test.com';
      component.password = 'wrong';
      authServiceMock.login.mockImplementation(() => throwError(() => ({ error: { message: 'Invalid credentials' } })));
      component.login();
      expect(snackBarMock.open).toHaveBeenCalledWith('Invalid credentials', 'Close', { duration: 5000 });
    });

    it('should show default error message when error has no message', () => {
      component.email = 'admin@test.com';
      component.password = 'wrong';
      authServiceMock.login.mockImplementation(() => throwError(() => ({})));
      component.login();
      expect(snackBarMock.open).toHaveBeenCalledWith('Login failed. Please check your credentials.', 'Close', { duration: 5000 });
    });

    it('should reset isLoading on error', () => {
      component.email = 'admin@test.com';
      component.password = 'wrong';
      authServiceMock.login.mockImplementation(() => throwError(() => ({})));
      component.login();
      expect(component.isLoading).toBe(false);
    });
  });
});
