import { Route } from '@angular/router';
import { authGuard } from './guards/auth.guard';

export const appRoutes: Route[] = [
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () => import('./components/layout/layout.component').then(m => m.LayoutComponent),
    children: [
      {
        path: '',
        redirectTo: 'tenants',
        pathMatch: 'full'
      },
      {
        path: 'tenants',
        loadComponent: () => import('./pages/tenants/tenants.component').then(m => m.TenantsComponent)
      },
      {
        path: 'pages',
        loadComponent: () => import('./pages/pages/pages.component').then(m => m.PagesComponent)
      },
      {
        path: 'faqs',
        loadComponent: () => import('./pages/faqs/faqs.component').then(m => m.FaqsComponent)
      },
      {
        path: 'notifications',
        loadComponent: () => import('./pages/notifications/notifications.component').then(m => m.NotificationsComponent)
      },
    ]
  },
  {
    path: '**',
    redirectTo: 'tenants'
  }
];
