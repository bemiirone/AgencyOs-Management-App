import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule, FormsModule, FormBuilder } from '@angular/forms';
import { UserAdminComponent } from '../user-admin.component';
import { UserStore } from '../../../../stores/user.store';
import { ToastService } from '../../../../core/services/toast.service';
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('UserAdminComponent', () => {
  let component: UserAdminComponent;
  let fixture: ComponentFixture<UserAdminComponent>;
  let storeMock: any;
  let toastMock: any;

  beforeEach(async () => {
    storeMock = {
      users: vi.fn(() => []),
      isLoading: vi.fn(() => false),
      loadUsers: vi.fn(() => ({ subscribe: vi.fn() })),
      createUser: vi.fn(() => ({ subscribe: vi.fn() })),
      updateRole: vi.fn(() => ({ subscribe: vi.fn() })),
      softDelete: vi.fn(() => ({ subscribe: vi.fn() })),
      reactivate: vi.fn(() => ({ subscribe: vi.fn() })),
    };

    toastMock = {
      success: vi.fn(),
      error: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [ReactiveFormsModule, FormsModule, UserAdminComponent],
      providers: [
        { provide: UserStore, useValue: storeMock },
        { provide: ToastService, useValue: toastMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(UserAdminComponent);
    component = fixture.componentInstance;
  });

  describe('Form Initialization', () => {
    it('should create the component', () => {
      expect(component).toBeTruthy();
    });

    it('should initialize form with correct default values', () => {
      const form = component.createUserForm;
      expect(form.get('name')?.value).toBe('');
      expect(form.get('email')?.value).toBe('');
      expect(form.get('password')?.value).toBe('');
      expect(form.get('role')?.value).toBe('member');
    });

    it('should have form pristine and untouched initially', () => {
      const form = component.createUserForm;
      expect(form.pristine).toBe(true);
      expect(form.touched).toBe(false);
    });
  });

  describe('Form Validation - Name', () => {
    it('should be invalid when name is empty', () => {
      component.createUserForm.get('name')?.setValue('');
      expect(component.createUserForm.get('name')?.valid).toBe(false);
    });

    it('should be invalid when name is less than 2 characters', () => {
      component.createUserForm.get('name')?.setValue('A');
      expect(component.createUserForm.get('name')?.valid).toBe(false);
    });

    it('should be valid when name is 2 or more characters', () => {
      component.createUserForm.get('name')?.setValue('AB');
      expect(component.createUserForm.get('name')?.valid).toBe(true);
    });

    it('should be valid when name is long', () => {
      component.createUserForm.get('name')?.setValue('John Doe');
      expect(component.createUserForm.get('name')?.valid).toBe(true);
    });
  });

  describe('Form Validation - Email', () => {
    it('should be invalid when email is empty', () => {
      component.createUserForm.get('email')?.setValue('');
      expect(component.createUserForm.get('email')?.valid).toBe(false);
    });

    it('should be invalid when email format is incorrect', () => {
      component.createUserForm.get('email')?.setValue('not-an-email');
      expect(component.createUserForm.get('email')?.valid).toBe(false);
    });

    it('should be valid when email format is correct', () => {
      component.createUserForm.get('email')?.setValue('test@example.com');
      expect(component.createUserForm.get('email')?.valid).toBe(true);
    });
  });

  describe('Form Validation - Password', () => {
    it('should be invalid when password is empty', () => {
      component.createUserForm.get('password')?.setValue('');
      expect(component.createUserForm.get('password')?.valid).toBe(false);
    });

    it('should be invalid when password is less than 8 characters', () => {
      component.createUserForm.get('password')?.setValue('short');
      expect(component.createUserForm.get('password')?.valid).toBe(false);
    });

    it('should be valid when password is 8 or more characters', () => {
      component.createUserForm.get('password')?.setValue('12345678');
      expect(component.createUserForm.get('password')?.valid).toBe(true);
    });
  });

  describe('Form Validation - Role', () => {
    it('should be valid with default role value', () => {
      expect(component.createUserForm.get('role')?.valid).toBe(true);
    });

    it('should be invalid when role is empty', () => {
      component.createUserForm.get('role')?.setValue('');
      expect(component.createUserForm.get('role')?.valid).toBe(false);
    });

    it('should be valid for all role options', () => {
      ['member', 'manager', 'admin'].forEach((role) => {
        component.createUserForm.get('role')?.setValue(role);
        expect(component.createUserForm.get('role')?.valid).toBe(true);
      });
    });
  });

  describe('createUser()', () => {
    it('should not submit when form is invalid', () => {
      component.createUser();
      expect(storeMock.createUser).not.toHaveBeenCalled();
    });

    it('should mark all fields as touched when form is invalid', () => {
      component.createUser();
      expect(component.createUserForm.get('name')?.touched).toBe(true);
      expect(component.createUserForm.get('email')?.touched).toBe(true);
      expect(component.createUserForm.get('password')?.touched).toBe(true);
      expect(component.createUserForm.get('role')?.touched).toBe(true);
    });

    it('should submit valid form data to store', () => {
      component.createUserForm.setValue({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        role: 'member',
      });

      component.createUser();

      expect(storeMock.createUser).toHaveBeenCalledWith({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        role: 'member',
      });
    });

    it('should toggle form visibility after successful submission', () => {
      component.createUserForm.setValue({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        role: 'member',
      });

      component.showCreateForm = true;

      const subscribeFn = vi.fn((callbacks: any) => {
        if (callbacks.next) {
          callbacks.next();
        }
        return { unsubscribe: vi.fn() };
      });
      storeMock.createUser.mockReturnValue({ subscribe: subscribeFn });

      component.createUser();

      expect(component.showCreateForm).toBe(false);
    });
  });

  describe('toggleCreateForm()', () => {
    it('should toggle showCreateForm', () => {
      expect(component.showCreateForm).toBe(false);
      component.toggleCreateForm();
      expect(component.showCreateForm).toBe(true);
      component.toggleCreateForm();
      expect(component.showCreateForm).toBe(false);
    });

    it('should reset form to defaults when toggled', () => {
      component.createUserForm.setValue({
        name: 'Test',
        email: 'test@test.com',
        password: 'password123',
        role: 'admin',
      });

      component.toggleCreateForm();

      expect(component.createUserForm.get('name')?.value).toBeNull();
      expect(component.createUserForm.get('email')?.value).toBeNull();
      expect(component.createUserForm.get('password')?.value).toBeNull();
      expect(component.createUserForm.get('role')?.value).toBe('member');
    });

    it('should reset showPassword to false', () => {
      component.showPassword.set(true);
      component.toggleCreateForm();
      expect(component.showPassword()).toBe(false);
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

  describe('saveRole()', () => {
    it('should call updateRole with correct params', () => {
      component.editingRole = 'admin';
      component.saveRole('user-123');
      expect(storeMock.updateRole).toHaveBeenCalledWith('user-123', 'admin');
    });

    it('should reset editing state after save', () => {
      component.editingUserId = 'user-123';
      component.editingRole = 'admin';
      component.saveRole('user-123');
      expect(component.editingUserId).toBeNull();
      expect(component.editingRole).toBeNull();
    });

    it('should not call updateRole when editingRole is null', () => {
      component.editingRole = null;
      component.saveRole('user-123');
      expect(storeMock.updateRole).not.toHaveBeenCalled();
    });
  });

  describe('cancelEditRole()', () => {
    it('should reset editing state', () => {
      component.editingUserId = 'user-123';
      component.editingRole = 'admin';
      component.cancelEditRole();
      expect(component.editingUserId).toBeNull();
      expect(component.editingRole).toBeNull();
    });
  });

  describe('deactivateUser()', () => {
    it('should call softDelete when confirmed', () => {
      vi.stubGlobal('confirm', () => true);
      component.deactivateUser({ id: 'user-123', name: 'Test', email: '', role: '', isActive: true, createdAt: '', updatedAt: '' });
      expect(storeMock.softDelete).toHaveBeenCalledWith('user-123');
      vi.unstubAllGlobals();
    });

    it('should not call softDelete when not confirmed', () => {
      vi.stubGlobal('confirm', () => false);
      component.deactivateUser({ id: 'user-123', name: 'Test', email: '', role: '', isActive: true, createdAt: '', updatedAt: '' });
      expect(storeMock.softDelete).not.toHaveBeenCalled();
      vi.unstubAllGlobals();
    });
  });

  describe('reactivateUser()', () => {
    it('should call reactivate with correct user id', () => {
      component.reactivateUser({ id: 'user-123', name: 'Test', email: '', role: '', isActive: false, createdAt: '', updatedAt: '' });
      expect(storeMock.reactivate).toHaveBeenCalledWith('user-123');
    });
  });

  describe('getRoleBadgeClass()', () => {
    it('should return badge-primary for admin', () => {
      expect(component.getRoleBadgeClass('admin')).toBe('badge-primary');
    });

    it('should return badge-secondary for manager', () => {
      expect(component.getRoleBadgeClass('manager')).toBe('badge-secondary');
    });

    it('should return badge-ghost for member', () => {
      expect(component.getRoleBadgeClass('member')).toBe('badge-ghost');
    });
  });

  describe('trackByUserId()', () => {
    it('should return user id', () => {
      const user = { id: 'user-123', name: 'Test', email: '', role: '', isActive: true, createdAt: '', updatedAt: '' };
      expect(component.trackByUserId(0, user)).toBe('user-123');
    });
  });
});
