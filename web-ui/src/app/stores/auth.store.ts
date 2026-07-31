import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, tap, throwError } from 'rxjs';
import { User } from '../shared/models/user.model';
import { API_CONFIG } from '../core/config/api.config';
import { StorageService } from '../core/services/storage.service';

export interface WorkspaceInfo {
  tenantId: string;
  tenantName: string;
  role: string;
  isLastUsed: boolean;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
  requiresWorkspaceSelection?: boolean;
  workspaces?: WorkspaceInfo[];
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

@Injectable({ providedIn: 'root' })
export class AuthStore {
  private http = inject(HttpClient);
  private storage = inject(StorageService);

  private _state = signal<AuthState>({
    user: null,
    token: this.storage.getToken(),
    isAuthenticated: !!this.storage.getToken(),
    isLoading: false,
    error: null,
  });

  state = computed(() => this._state());
  user = computed(() => this._state().user);
  isAuthenticated = computed(() => this._state().isAuthenticated);
  isLoading = computed(() => this._state().isLoading);
  error = computed(() => this._state().error);

  login(email: string, password: string) {
    this._state.update((s) => ({ ...s, isLoading: true, error: null }));

    return this.http.post<AuthResponse>(API_CONFIG.AUTH.LOGIN, { email, password }).pipe(
      tap((response: AuthResponse) => {
        this.storage.setToken(response.accessToken);
        this.storage.setUser(response.user);
        this._state.set({
          user: response.user,
          token: response.accessToken,
          isAuthenticated: true,
          isLoading: false,
          error: null,
        });
      }),
      catchError((error) => {
        this._state.update((s) => ({
          ...s,
          isLoading: false,
          error: error.error?.message || 'Login failed',
        }));
        return throwError(() => error);
      })
    );
  }

  register(name: string, email: string, password: string) {
    this._state.update((s) => ({ ...s, isLoading: true, error: null }));

    return this.http.post<AuthResponse>(API_CONFIG.AUTH.REGISTER, { name, email, password }).pipe(
      tap((response: AuthResponse) => {
        this.storage.setToken(response.accessToken);
        this.storage.setUser(response.user);
        this._state.set({
          user: response.user,
          token: response.accessToken,
          isAuthenticated: true,
          isLoading: false,
          error: null,
        });
      }),
      catchError((error) => {
        this._state.update((s) => ({
          ...s,
          isLoading: false,
          error: error.error?.message || 'Registration failed',
        }));
        return throwError(() => error);
      })
    );
  }

  logout(): void {
    this.storage.clear();
    this._state.set({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
    });
  }

  hasRole(role: string): boolean {
    return this._state().user?.role === role;
  }
}
