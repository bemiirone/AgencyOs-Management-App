import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { API_CONFIG } from '../config/api.config';
import { StorageService } from './storage.service';
import { User } from '../../shared/models/user.model';

interface LoginRequest {
  email: string;
  password: string;
  tenantId?: string;
}

interface RegisterRequest {
  email: string;
  password: string;
  name: string;
  agencyName: string;
}

interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
  requiresWorkspaceSelection?: boolean;
  workspaces?: Workspace[];
}

export interface Workspace {
  tenantId: string;
  tenantName: string;
  role: string;
  isLastUsed: boolean;
  isActive: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private storageService = inject(StorageService);

  private currentUser = signal<User | null>(null);
  private workspaces = signal<Workspace[]>([]);
  private showWorkspaceSelect = signal(false);

  constructor() {
    const storedUser = this.storageService.getUser();
    if (storedUser) {
      this.currentUser.set(storedUser);
    }
  }

  async login(credentials: LoginRequest): Promise<AuthResponse> {
    const response = await firstValueFrom(
      this.http.post<AuthResponse>(`${API_CONFIG.baseUrl}${API_CONFIG.AUTH.LOGIN}`, credentials)
    );

    this.storageService.setToken(response.accessToken);
    this.storageService.setRefreshToken(response.refreshToken);
    this.storageService.setUser(response.user);
    this.currentUser.set(response.user);

    if (response.workspaces) {
      this.workspaces.set(response.workspaces);
    }

    return response;
  }

  async register(data: RegisterRequest): Promise<AuthResponse> {
    const response = await firstValueFrom(
      this.http.post<AuthResponse>(`${API_CONFIG.baseUrl}${API_CONFIG.AUTH.REGISTER}`, data)
    );

    this.storageService.setToken(response.accessToken);
    this.storageService.setRefreshToken(response.refreshToken);
    this.storageService.setUser(response.user);
    this.currentUser.set(response.user);

    return response;
  }

  async logout(): Promise<void> {
    this.storageService.clear();
    this.currentUser.set(null);
    this.workspaces.set([]);
    this.showWorkspaceSelect.set(false);
    await this.router.navigate(['/login']);
  }

  async refreshProfile(): Promise<User> {
    const user = await firstValueFrom(
      this.http.get<User>(`${API_CONFIG.baseUrl}${API_CONFIG.AUTH.PROFILE}`)
    );

    this.storageService.setUser(user);
    this.currentUser.set(user);

    return user;
  }

  async getWorkspaces(): Promise<Workspace[]> {
    const workspaces = await firstValueFrom(
      this.http.get<Workspace[]>(`${API_CONFIG.baseUrl}${API_CONFIG.AUTH.WORKSPACES}`)
    );

    const lastWorkspace = this.storageService.getLastWorkspace();
    const updated = workspaces.map((w) => ({
      ...w,
      isLastUsed: w.tenantId === lastWorkspace,
    }));

    this.workspaces.set(updated);
    return updated;
  }

  async switchWorkspace(tenantId: string): Promise<void> {
    const response = await firstValueFrom(
      this.http.post<AuthResponse>(`${API_CONFIG.baseUrl}${API_CONFIG.AUTH.SWITCH_WORKSPACE}`, { tenantId })
    );

    this.storageService.setToken(response.accessToken);
    this.storageService.setRefreshToken(response.refreshToken);
    this.storageService.setUser(response.user);
    this.storageService.setLastWorkspace(tenantId);
    this.currentUser.set(response.user);
    this.showWorkspaceSelect.set(false);

    const workspaces = this.workspaces().map((w) => ({
      ...w,
      isLastUsed: w.tenantId === tenantId,
    }));
    this.workspaces.set(workspaces);
  }

  async joinWorkspace(tenantId: string, inviteCode: string): Promise<Workspace[]> {
    const workspaces = await firstValueFrom(
      this.http.post<Workspace[]>(`${API_CONFIG.baseUrl}${API_CONFIG.AUTH.JOIN_WORKSPACE}`, { tenantId, inviteCode })
    );

    this.workspaces.set(workspaces);
    return workspaces;
  }

  async searchWorkspaces(query: string): Promise<{ tenantId: string; tenantName: string; slug: string }[]> {
    if (!query || query.trim().length < 2) {
      return [];
    }

    return firstValueFrom(
      this.http.get<{ tenantId: string; tenantName: string; slug: string }[]>(
        `${API_CONFIG.baseUrl}${API_CONFIG.AUTH.SEARCH_WORKSPACES(query)}`
      )
    );
  }

  async lookupWorkspaces(email: string): Promise<Workspace[]> {
    if (!email || email.trim().length === 0) {
      return [];
    }

    const workspaces = await firstValueFrom(
      this.http.post<Workspace[]>(`${API_CONFIG.baseUrl}${API_CONFIG.AUTH.LOOKUP_WORKSPACES}`, { email })
    );

    const lastWorkspace = this.storageService.getLastWorkspace();
    const updated = workspaces.map((w) => ({
      ...w,
      isLastUsed: w.tenantId === lastWorkspace,
    }));

    this.workspaces.set(updated);
    return updated;
  }

  isAuthenticated(): boolean {
    return !!this.storageService.getToken() && !!this.currentUser();
  }

  getUser(): User | null {
    return this.currentUser();
  }

  getUserRole(): string {
    return this.currentUser()?.role ?? '';
  }

  isAdmin(): boolean {
    return this.currentUser()?.role === 'admin';
  }

  getUserId(): string | null {
    return this.currentUser()?.id ?? null;
  }

  getTenantId(): string | null {
    return this.currentUser()?.tenantId ?? null;
  }

  getTenantName(): string {
    return this.currentUser()?.tenantName ?? '';
  }

  getWorkspacesSignal() {
    return this.workspaces;
  }

  hasMultipleWorkspaces(): boolean {
    return this.workspaces().length > 1;
  }

  getShowWorkspaceSelect() {
    return this.showWorkspaceSelect;
  }

  setShowWorkspaceSelect(value: boolean) {
    this.showWorkspaceSelect.set(value);
  }
}
