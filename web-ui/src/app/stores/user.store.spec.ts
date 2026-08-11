import { TestBed } from '@angular/core/testing';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { UserStore, UserWithRole, CreateUserDto, UpdateUserDto } from './user.store';
import { ToastService } from '../core/services/toast.service';
import { API_CONFIG } from '../core/config/api.config';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('UserStore', () => {
  let store: UserStore;
  let httpMock: HttpTestingController;
  let toastMock: { success: any; error: any; info: any; warning: any };

  const mockUser: UserWithRole = {
    id: 'user-1',
    email: 'test@example.com',
    name: 'Test User',
    role: 'admin',
    isActive: true,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  };

  beforeEach(() => {
    toastMock = {
      success: vi.fn(),
      error: vi.fn(),
      info: vi.fn(),
      warning: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        UserStore,
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting(),
        { provide: ToastService, useValue: toastMock },
      ],
    });

    store = TestBed.inject(UserStore);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    vi.clearAllMocks();
  });

  describe('loadUsers', () => {
    it('should load users from service', () => {
      const mockUsers = [mockUser];

      store.loadUsers().subscribe((users) => {
        expect(users).toEqual(mockUsers);
        expect(store.users()).toEqual(mockUsers);
        expect(store.isLoading()).toBe(false);
      });

      const req = httpMock.expectOne(`${API_CONFIG.baseUrl}${API_CONFIG.USERS.LIST}`);
      expect(req.request.method).toBe('GET');
      req.flush(mockUsers);
    });

    it('should set error on failure', () => {
      store.loadUsers().subscribe({
        error: () => {
          expect(store.error()).toBe('Failed to load users');
          expect(toastMock.error).toHaveBeenCalledWith('Failed to load users');
        },
      });

      const req = httpMock.expectOne(`${API_CONFIG.baseUrl}${API_CONFIG.USERS.LIST}`);
      req.flush({ error: { message: 'Error' } }, { status: 500, statusText: 'Error' });
    });
  });

  describe('createUser', () => {
    it('should create a user and show success toast', () => {
      const createData: CreateUserDto = {
        name: 'New User',
        email: 'new@example.com',
        password: 'password',
      };

      const newUser: UserWithRole = {
        ...mockUser,
        id: 'user-2',
        name: 'New User',
        email: 'new@example.com',
      };

      store.createUser(createData).subscribe((user) => {
        expect(user.name).toBe('New User');
        expect(store.users()).toContain(newUser);
        expect(toastMock.success).toHaveBeenCalledWith('User created successfully');
      });

      const req = httpMock.expectOne(`${API_CONFIG.baseUrl}${API_CONFIG.USERS.CREATE}`);
      expect(req.request.method).toBe('POST');
      req.flush(newUser);
    });

    it('should show error toast on failure', () => {
      store.createUser({ name: 'Fail', email: 'fail@test.com', password: 'pass' }).subscribe({
        error: () => {
          expect(store.error()).toBe('Failed to create user');
          expect(toastMock.error).toHaveBeenCalledWith('Failed to create user');
        },
      });

      const req = httpMock.expectOne(`${API_CONFIG.baseUrl}${API_CONFIG.USERS.CREATE}`);
      req.flush({ error: { message: 'Error' } }, { status: 400, statusText: 'Bad Request' });
    });
  });

  describe('updateUser', () => {
    it('should update a user and show success toast', () => {
      const updateData: UpdateUserDto = { name: 'Updated User' };

      const updatedUser: UserWithRole = {
        ...mockUser,
        name: 'Updated User',
      };

      store.updateUser('user-1', updateData).subscribe((user) => {
        expect(user.name).toBe('Updated User');
        expect(toastMock.success).toHaveBeenCalledWith('User updated successfully');
      });

      const req = httpMock.expectOne(`${API_CONFIG.baseUrl}${API_CONFIG.USERS.UPDATE('user-1')}`);
      expect(req.request.method).toBe('PATCH');
      req.flush(updatedUser);
    });

    it('should show error toast on failure', () => {
      store.updateUser('user-1', { name: 'Fail' }).subscribe({
        error: () => {
          expect(store.error()).toBe('Failed to update user');
          expect(toastMock.error).toHaveBeenCalledWith('Failed to update user');
        },
      });

      const req = httpMock.expectOne(`${API_CONFIG.baseUrl}${API_CONFIG.USERS.UPDATE('user-1')}`);
      req.flush({ error: { message: 'Error' } }, { status: 400, statusText: 'Bad Request' });
    });
  });

  describe('updateRole', () => {
    it('should update user role and show success toast', () => {
      const updatedUser: UserWithRole = {
        ...mockUser,
        role: 'manager',
      };

      store.updateRole('user-1', 'manager').subscribe((user) => {
        expect(user.role).toBe('manager');
        expect(toastMock.success).toHaveBeenCalledWith('Role updated successfully');
      });

      const req = httpMock.expectOne(`${API_CONFIG.baseUrl}${API_CONFIG.USERS.UPDATE_ROLE('user-1')}`);
      expect(req.request.method).toBe('PATCH');
      req.flush(updatedUser);
    });

    it('should show error toast on failure', () => {
      store.updateRole('user-1', 'invalid').subscribe({
        error: () => {
          expect(store.error()).toBe('Failed to update role');
          expect(toastMock.error).toHaveBeenCalledWith('Failed to update role');
        },
      });

      const req = httpMock.expectOne(`${API_CONFIG.baseUrl}${API_CONFIG.USERS.UPDATE_ROLE('user-1')}`);
      req.flush({ error: { message: 'Error' } }, { status: 400, statusText: 'Bad Request' });
    });
  });

  describe('softDelete', () => {
    it('should deactivate a user and show success toast', () => {
      // First load the user
      store.loadUsers().subscribe();
      httpMock.expectOne(`${API_CONFIG.baseUrl}${API_CONFIG.USERS.LIST}`).flush([mockUser]);

      store.softDelete('user-1').subscribe(() => {
        const user = store.users().find((u) => u.id === 'user-1');
        expect(user?.isActive).toBe(false);
        expect(toastMock.success).toHaveBeenCalledWith('User deactivated');
      });

      const req = httpMock.expectOne(`${API_CONFIG.baseUrl}${API_CONFIG.USERS.DELETE('user-1')}`);
      expect(req.request.method).toBe('DELETE');
      req.flush({ success: true });
    });

    it('should show error toast on failure', () => {
      store.softDelete('user-1').subscribe({
        error: () => {
          expect(store.error()).toBe('Failed to deactivate user');
          expect(toastMock.error).toHaveBeenCalledWith('Failed to deactivate user');
        },
      });

      const req = httpMock.expectOne(`${API_CONFIG.baseUrl}${API_CONFIG.USERS.DELETE('user-1')}`);
      req.flush({ error: { message: 'Error' } }, { status: 400, statusText: 'Bad Request' });
    });
  });

  describe('reactivate', () => {
    it('should reactivate a user and show success toast', () => {
      const reactivatedUser: UserWithRole = {
        ...mockUser,
        isActive: true,
      };

      store.reactivate('user-1').subscribe((user) => {
        expect(user.isActive).toBe(true);
        expect(toastMock.success).toHaveBeenCalledWith('User reactivated');
      });

      const req = httpMock.expectOne(`${API_CONFIG.baseUrl}${API_CONFIG.USERS.REACTIVATE('user-1')}`);
      expect(req.request.method).toBe('PATCH');
      req.flush(reactivatedUser);
    });

    it('should show error toast on failure', () => {
      store.reactivate('user-1').subscribe({
        error: () => {
          expect(store.error()).toBe('Failed to reactivate user');
          expect(toastMock.error).toHaveBeenCalledWith('Failed to reactivate user');
        },
      });

      const req = httpMock.expectOne(`${API_CONFIG.baseUrl}${API_CONFIG.USERS.REACTIVATE('user-1')}`);
      req.flush({ error: { message: 'Error' } }, { status: 400, statusText: 'Bad Request' });
    });
  });
});
