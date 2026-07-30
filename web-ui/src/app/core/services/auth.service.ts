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
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private storageService = inject(StorageService);

  private currentUser = signal<User | null>(null);

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

  isAuthenticated(): boolean {
    return !!this.storageService.getToken() && !!this.currentUser();
  }

  getUser(): User | null {
    return this.currentUser();
  }

  getUserRole(): string {
    return this.currentUser()?.role ?? '';
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
}
