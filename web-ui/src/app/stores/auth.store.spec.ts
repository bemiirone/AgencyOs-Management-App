import { TestBed } from '@angular/core/testing';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { AuthStore, AuthResponse } from './auth.store';
import { StorageService } from '../core/services/storage.service';
import { API_CONFIG } from '../core/config/api.config';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('AuthStore', () => {
  let store: AuthStore;
  let httpMock: HttpTestingController;
  let storageMock: {
    getToken: any;
    setToken: any;
    setUser: any;
    getUser: any;
    clear: any;
  };

  const mockUser = {
    id: 'user-1',
    email: 'test@example.com',
    name: 'Test User',
    role: 'admin' as const,
    tenantId: 'tenant-1',
    tenantName: 'Test Tenant',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockAuthResponse: AuthResponse = {
    user: mockUser,
    accessToken: 'test-access-token',
    refreshToken: 'test-refresh-token',
  };

  beforeEach(() => {
    storageMock = {
      getToken: vi.fn(() => null),
      setToken: vi.fn(),
      setUser: vi.fn(),
      getUser: vi.fn(() => null),
      clear: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        AuthStore,
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting(),
        { provide: StorageService, useValue: storageMock },
      ],
    });

    store = TestBed.inject(AuthStore);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    vi.clearAllMocks();
  });

  describe('initial state', () => {
    it('should initialize with null user and not authenticated', () => {
      expect(store.user()).toBeNull();
      expect(store.isAuthenticated()).toBe(false);
      expect(store.isLoading()).toBe(false);
      expect(store.error()).toBeNull();
    });

    it('should initialize as authenticated when token exists', () => {
      storageMock.getToken.mockReturnValue('existing-token');

      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [
          AuthStore,
          provideHttpClient(withInterceptorsFromDi()),
          provideHttpClientTesting(),
          { provide: StorageService, useValue: storageMock },
        ],
      });

      const newStore = TestBed.inject(AuthStore);
      expect(newStore.isAuthenticated()).toBe(true);
    });
  });

  describe('login', () => {
    it('should login successfully and store token', () => {
      store.login('test@example.com', 'password').subscribe((response) => {
        expect(response.user).toEqual(mockUser);
        expect(store.user()).toEqual(mockUser);
        expect(store.isAuthenticated()).toBe(true);
        expect(store.isLoading()).toBe(false);
        expect(storageMock.setToken).toHaveBeenCalledWith('test-access-token');
        expect(storageMock.setUser).toHaveBeenCalledWith(mockUser);
      });

      const req = httpMock.expectOne(API_CONFIG.AUTH.LOGIN);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ email: 'test@example.com', password: 'password' });
      req.flush(mockAuthResponse);
    });

    it('should set loading state during login', () => {
      store.login('test@example.com', 'password').subscribe();
      expect(store.isLoading()).toBe(true);

      const req = httpMock.expectOne(API_CONFIG.AUTH.LOGIN);
      req.flush(mockAuthResponse);
      expect(store.isLoading()).toBe(false);
    });

    it('should show error on login failure', () => {
      store.login('test@example.com', 'wrong').subscribe({
        next: () => undefined,
        error: () => {
          expect(store.isLoading()).toBe(false);
        },
      });

      const req = httpMock.expectOne(API_CONFIG.AUTH.LOGIN);
      req.flush({ message: 'Invalid credentials' }, { status: 401, statusText: 'Unauthorized' });
    });

    it('should use error message from response when available', () => {
      store.login('test@example.com', 'wrong').subscribe({
        next: () => undefined,
        error: () => {
          expect(store.error()).toBe('Account locked');
        },
      });

      const req = httpMock.expectOne(API_CONFIG.AUTH.LOGIN);
      req.flush({ message: 'Account locked' }, { status: 401, statusText: 'Unauthorized' });
    });
  });

  describe('register', () => {
    it('should register successfully and store token', () => {
      store.register('Test User', 'test@example.com', 'password').subscribe((response) => {
        expect(response.user).toEqual(mockUser);
        expect(store.user()).toEqual(mockUser);
        expect(store.isAuthenticated()).toBe(true);
        expect(storageMock.setToken).toHaveBeenCalledWith('test-access-token');
        expect(storageMock.setUser).toHaveBeenCalledWith(mockUser);
      });

      const req = httpMock.expectOne(API_CONFIG.AUTH.REGISTER);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ name: 'Test User', email: 'test@example.com', password: 'password' });
      req.flush(mockAuthResponse);
    });

    it('should set loading state during registration', () => {
      store.register('Test User', 'test@example.com', 'password').subscribe();
      expect(store.isLoading()).toBe(true);

      const req = httpMock.expectOne(API_CONFIG.AUTH.REGISTER);
      req.flush(mockAuthResponse);
      expect(store.isLoading()).toBe(false);
    });

    it('should show error on registration failure', () => {
      store.register('Test User', 'test@example.com', 'password').subscribe({
        next: () => undefined,
        error: () => {
          expect(store.isLoading()).toBe(false);
        },
      });

      const req = httpMock.expectOne(API_CONFIG.AUTH.REGISTER);
      req.flush({ message: 'Email already exists' }, { status: 400, statusText: 'Bad Request' });
    });
  });

  describe('logout', () => {
    it('should clear storage and reset state', () => {
      store.logout();

      expect(storageMock.clear).toHaveBeenCalled();
      expect(store.user()).toBeNull();
      expect(store.isAuthenticated()).toBe(false);
      expect(store.isLoading()).toBe(false);
      expect(store.error()).toBeNull();
    });
  });

  describe('hasRole', () => {
    it('should return true when user has the specified role', () => {
      store.login('test@example.com', 'password').subscribe();
      httpMock.expectOne(API_CONFIG.AUTH.LOGIN).flush(mockAuthResponse);

      expect(store.hasRole('admin')).toBe(true);
    });

    it('should return false when user does not have the specified role', () => {
      store.login('test@example.com', 'password').subscribe();
      httpMock.expectOne(API_CONFIG.AUTH.LOGIN).flush(mockAuthResponse);

      expect(store.hasRole('client')).toBe(false);
    });

    it('should return false when user is null', () => {
      expect(store.hasRole('admin')).toBe(false);
    });
  });
});
