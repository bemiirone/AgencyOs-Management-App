import { inject } from '@angular/core';
import { Router, CanActivateFn, ActivatedRouteSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const roleGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const expectedRoles = route.data['roles'] as string[];

  if (!authService.isAuthenticated()) {
    return router.createUrlTree(['/login']);
  }

  const userRole = authService.getUserRole();

  if (expectedRoles && !expectedRoles.includes(userRole)) {
    return router.createUrlTree(['/dashboard']);
  }

  return true;
};
