import { HttpInterceptorFn, HttpRequest, HttpHandlerFn, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, throwError, BehaviorSubject, catchError, switchMap, filter, take, finalize, from } from 'rxjs';
import { API_CONFIG } from '../config/api.config';
import { StorageService } from '../services/storage.service';
import { AuthService } from '../services/auth.service';

let isRefreshing = false;
const refreshTokenSubject = new BehaviorSubject<string | null>(null);

export const authInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
): Observable<HttpEvent<unknown>> => {
  const storageService = inject(StorageService);
  const authService = inject(AuthService);
  const router = inject(Router);
  const token = storageService.getToken();

  const excludedPaths = [
    API_CONFIG.AUTH.LOGIN,
    API_CONFIG.AUTH.REGISTER,
    API_CONFIG.AUTH.REFRESH,
  ];

  const shouldAttachToken = !excludedPaths.some((path) => {
    if (typeof path === 'function') return false;
    return req.url.includes(path);
  });

  if (token && shouldAttachToken) {
    const authReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
      },
    });
    return next(authReq).pipe(
      catchError((error: HttpErrorResponse) => {
        if (error.status === 401) {
          return handle401(req, next, authService, storageService, router);
        }
        return throwError(() => error);
      })
    );
  }

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401 && token) {
        return handle401(req, next, authService, storageService, router);
      }
      return throwError(() => error);
    })
  );
};

function handle401(
  req: HttpRequest<unknown>,
  next: HttpHandlerFn,
  authService: AuthService,
  storageService: StorageService,
  router: Router
): Observable<HttpEvent<unknown>> {
  if (!isRefreshing) {
    isRefreshing = true;
    refreshTokenSubject.next(null);

    return from(authService.refreshAccessToken()).pipe(
      switchMap((success: boolean) => {
        isRefreshing = false;
        const newToken = storageService.getToken();
        refreshTokenSubject.next(newToken);

        if (success && newToken) {
          return next(req.clone({
            setHeaders: { Authorization: `Bearer ${newToken}` },
          }));
        }

        router.navigate(['/login']);
        return throwError(() => new Error('Session expired'));
      }),
      catchError((error) => {
        isRefreshing = false;
        refreshTokenSubject.next(null);
        router.navigate(['/login']);
        return throwError(() => error);
      }),
      finalize(() => {
        isRefreshing = false;
      })
    );
  }

  return refreshTokenSubject.pipe(
    filter((token): token is string => token !== null),
    take(1),
    switchMap((token) => next(req.clone({
      setHeaders: { Authorization: `Bearer ${token}` },
    })))
  );
}
