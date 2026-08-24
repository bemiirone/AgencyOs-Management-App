import { HttpRequest, HttpHandlerFn } from '@angular/common/http';
import { authInterceptor } from './auth.interceptor';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('authInterceptor', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should add Authorization header when token exists', () => {
    localStorage.setItem('admin_token', 'test-token-123');

    const req = new HttpRequest('GET', '/api/test');
    let capturedRequest: HttpRequest<any> | null = null;

    const next: HttpHandlerFn = (request) => {
      capturedRequest = request;
      return {} as any;
    };

    authInterceptor(req, next);

    expect(capturedRequest).not.toBeNull();
    expect(capturedRequest!.headers.get('Authorization')).toBe('Bearer test-token-123');
  });

  it('should not add Authorization header when token is null', () => {
    const req = new HttpRequest('GET', '/api/test');
    let capturedRequest: HttpRequest<any> | null = null;

    const next: HttpHandlerFn = (request) => {
      capturedRequest = request;
      return {} as any;
    };

    authInterceptor(req, next);

    expect(capturedRequest).not.toBeNull();
    expect(capturedRequest!.headers.get('Authorization')).toBeNull();
  });

  it('should not add Authorization header when token is empty string', () => {
    localStorage.setItem('admin_token', '');

    const req = new HttpRequest('GET', '/api/test');
    let capturedRequest: HttpRequest<any> | null = null;

    const next: HttpHandlerFn = (request) => {
      capturedRequest = request;
      return {} as any;
    };

    authInterceptor(req, next);

    expect(capturedRequest).not.toBeNull();
    expect(capturedRequest!.headers.get('Authorization')).toBeNull();
  });

  it('should call next with the modified request', () => {
    localStorage.setItem('admin_token', 'token');

    const req = new HttpRequest('GET', '/api/test');
    const next = vi.fn<HttpHandlerFn>().mockReturnValue({} as any);

    authInterceptor(req, next);

    expect(next).toHaveBeenCalledTimes(1);
  });
});
