import { Injectable, signal, computed, inject } from '@angular/core';
import { catchError, tap, throwError } from 'rxjs';
import { UserAdminService } from '../core/services/user-admin.service';
import { ToastService } from '../core/services/toast.service';

export interface UserWithRole {
  id: string;
  email: string;
  name: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserDto {
  name: string;
  email: string;
  password: string;
  role?: string;
}

export interface UpdateUserDto {
  name?: string;
  email?: string;
  role?: string;
}

@Injectable({ providedIn: 'root' })
export class UserStore {
  private service = inject(UserAdminService);
  private toast = inject(ToastService);

  private _users = signal<UserWithRole[]>([]);
  private _isLoading = signal(false);
  private _error = signal<string | null>(null);

  users = computed(() => this._users());
  isLoading = computed(() => this._isLoading());
  error = computed(() => this._error());

  loadUsers() {
    this._isLoading.set(true);
    this._error.set(null);

    return this.service.findAll().pipe(
      tap((users) => {
        this._users.set(users);
        this._isLoading.set(false);
      }),
      catchError((error) => {
        this._error.set(error.error?.message || 'Failed to load users');
        this._isLoading.set(false);
        this.toast.error('Failed to load users');
        return throwError(() => error);
      })
    );
  }

  createUser(data: CreateUserDto) {
    this._isLoading.set(true);
    this._error.set(null);

    return this.service.create(data).pipe(
      tap((user) => {
        this._users.update((users) => [...users, user]);
        this._isLoading.set(false);
        this.toast.success('User created successfully');
      }),
      catchError((error) => {
        this._error.set(error.error?.message || 'Failed to create user');
        this._isLoading.set(false);
        this.toast.error('Failed to create user');
        return throwError(() => error);
      })
    );
  }

  updateUser(id: string, data: UpdateUserDto) {
    this._isLoading.set(true);
    this._error.set(null);

    return this.service.update(id, data).pipe(
      tap((user) => {
        this._users.update((users) =>
          users.map((u) => (u.id === id ? user : u))
        );
        this._isLoading.set(false);
        this.toast.success('User updated successfully');
      }),
      catchError((error) => {
        this._error.set(error.error?.message || 'Failed to update user');
        this._isLoading.set(false);
        this.toast.error('Failed to update user');
        return throwError(() => error);
      })
    );
  }

  updateRole(id: string, role: string) {
    this._isLoading.set(true);
    this._error.set(null);

    return this.service.updateRole(id, role).pipe(
      tap((user) => {
        this._users.update((users) =>
          users.map((u) => (u.id === id ? user : u))
        );
        this._isLoading.set(false);
        this.toast.success('Role updated successfully');
      }),
      catchError((error) => {
        this._error.set(error.error?.message || 'Failed to update role');
        this._isLoading.set(false);
        this.toast.error('Failed to update role');
        return throwError(() => error);
      })
    );
  }

  softDelete(id: string) {
    this._isLoading.set(true);
    this._error.set(null);

    return this.service.softDelete(id).pipe(
      tap(() => {
        this._users.update((users) =>
          users.map((u) => (u.id === id ? { ...u, isActive: false } : u))
        );
        this._isLoading.set(false);
        this.toast.success('User deactivated');
      }),
      catchError((error) => {
        this._error.set(error.error?.message || 'Failed to deactivate user');
        this._isLoading.set(false);
        this.toast.error('Failed to deactivate user');
        return throwError(() => error);
      })
    );
  }

  reactivate(id: string) {
    this._isLoading.set(true);
    this._error.set(null);

    return this.service.reactivate(id).pipe(
      tap((user) => {
        this._users.update((users) =>
          users.map((u) => (u.id === id ? user : u))
        );
        this._isLoading.set(false);
        this.toast.success('User reactivated');
      }),
      catchError((error) => {
        this._error.set(error.error?.message || 'Failed to reactivate user');
        this._isLoading.set(false);
        this.toast.error('Failed to reactivate user');
        return throwError(() => error);
      })
    );
  }
}
