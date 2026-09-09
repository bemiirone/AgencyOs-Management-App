import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { AdminLoginRequest, AdminLoginResponse } from '../models/admin.model';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private apiUrl = `${environment.apiBaseUrl}/api`;

  login(credentials: AdminLoginRequest): Observable<AdminLoginResponse> {
    return this.http.post<AdminLoginResponse>(`${this.apiUrl}/admin/auth/login`, credentials).pipe(
      tap((response) => {
        localStorage.setItem('admin_token', response.accessToken);
        localStorage.setItem('admin_user', JSON.stringify(response.admin));
      })
    );
  }

  logout(): void {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    return localStorage.getItem('admin_token');
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  getCurrentUser() {
    const user = localStorage.getItem('admin_user');
    return user ? JSON.parse(user) : null;
  }
}
