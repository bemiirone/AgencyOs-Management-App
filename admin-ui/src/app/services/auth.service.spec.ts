import { TestBed } from '@angular/core/testing';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import { AuthService } from './auth.service';
import { AdminLoginRequest, AdminLoginResponse } from '../models/admin.model';
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: any;
  let routerMock: any;

  beforeEach(() => {
    localStorage.clear();
    httpMock = {
      post: vi.fn(),
    };
    routerMock = {
      navigate: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        AuthService,
        { provide: HttpClient, useValue: httpMock },
        { provide: Router, useValue: routerMock },
      ],
    });

    service = TestBed.inject(AuthService);
  });

  describe('login()', () => {
    it('should call POST with correct URL and credentials', () => {
      const credentials: AdminLoginRequest = { email: 'admin@test.com', password: 'password123' };
      const response: AdminLoginResponse = {
        admin: { id: '1', email: 'admin@test.com', role: 'admin' },
        accessToken: 'token123',
      };
      httpMock.post.mockReturnValue(of(response));

      service.login(credentials).subscribe();

      expect(httpMock.post).toHaveBeenCalledWith(
        'http://localhost:3000/api/admin/auth/login',
        credentials
      );
    });

    it('should store token and user in localStorage on success', () => {
      const credentials: AdminLoginRequest = { email: 'admin@test.com', password: 'password123' };
      const response: AdminLoginResponse = {
        admin: { id: '1', email: 'admin@test.com', role: 'admin' },
        accessToken: 'token123',
      };
      httpMock.post.mockReturnValue(of(response));

      service.login(credentials).subscribe();

      expect(localStorage.getItem('admin_token')).toBe('token123');
      expect(localStorage.getItem('admin_user')).toBe(JSON.stringify(response.admin));
    });

    it('should return the response observable', () => {
      const credentials: AdminLoginRequest = { email: 'admin@test.com', password: 'password123' };
      const response: AdminLoginResponse = {
        admin: { id: '1', email: 'admin@test.com', role: 'admin' },
        accessToken: 'token123',
      };
      httpMock.post.mockReturnValue(of(response));

      service.login(credentials).subscribe((result) => {
        expect(result).toEqual(response);
      });
    });
  });

  describe('logout()', () => {
    it('should remove token and user from localStorage', () => {
      localStorage.setItem('admin_token', 'token123');
      localStorage.setItem('admin_user', JSON.stringify({ id: '1' }));

      service.logout();

      expect(localStorage.getItem('admin_token')).toBeNull();
      expect(localStorage.getItem('admin_user')).toBeNull();
    });

    it('should navigate to /login', () => {
      service.logout();
      expect(routerMock.navigate).toHaveBeenCalledWith(['/login']);
    });
  });

  describe('getToken()', () => {
    it('should return token when it exists', () => {
      localStorage.setItem('admin_token', 'token123');
      expect(service.getToken()).toBe('token123');
    });

    it('should return null when token does not exist', () => {
      expect(service.getToken()).toBeNull();
    });
  });

  describe('isAuthenticated()', () => {
    it('should return true when token exists', () => {
      localStorage.setItem('admin_token', 'token123');
      expect(service.isAuthenticated()).toBe(true);
    });

    it('should return false when token does not exist', () => {
      expect(service.isAuthenticated()).toBe(false);
    });
  });

  describe('getCurrentUser()', () => {
    it('should return parsed user object when user exists', () => {
      const user = { id: '1', email: 'admin@test.com', role: 'admin' };
      localStorage.setItem('admin_user', JSON.stringify(user));
      expect(service.getCurrentUser()).toEqual(user);
    });

    it('should return null when user does not exist', () => {
      expect(service.getCurrentUser()).toBeNull();
    });
  });
});
