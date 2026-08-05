import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { MainLayoutComponent } from './layout/main-layout/main-layout.component';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full',
  },
  {
    path: 'login',
    loadComponent: () =>
      import('./features/auth/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'register',
    loadComponent: () =>
      import('./features/auth/register/register.component').then((m) => m.RegisterComponent),
  },
  {
    path: '',
    component: MainLayoutComponent,
    canActivate: [authGuard],
    children: [
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/dashboard/dashboard.component').then((m) => m.DashboardComponent),
      },
      {
        path: 'projects',
        loadComponent: () =>
          import('./features/projects/project-list/project-list.component').then(
            (m) => m.ProjectListComponent
          ),
      },
      {
        path: 'projects/create',
        loadComponent: () =>
          import('./features/projects/project-form/project-form.component').then(
            (m) => m.ProjectFormComponent
          ),
      },
      {
        path: 'projects/:id',
        loadComponent: () =>
          import('./features/projects/project-detail/project-detail.component').then(
            (m) => m.ProjectDetailComponent
          ),
      },
      {
        path: 'projects/:id/edit',
        loadComponent: () =>
          import('./features/projects/project-form/project-form.component').then(
            (m) => m.ProjectFormComponent
          ),
      },
      {
        path: 'tasks',
        loadComponent: () =>
          import('./features/tasks/task-list/task-list.component').then(
            (m) => m.TaskListComponent
          ),
      },
      {
        path: 'tasks/create',
        loadComponent: () =>
          import('./features/tasks/task-create/task-create.component').then(
            (m) => m.TaskCreateComponent
          ),
      },
      {
        path: 'tasks/:id/edit',
        loadComponent: () =>
          import('./features/tasks/task-edit/task-edit.component').then(
            (m) => m.TaskEditComponent
          ),
      },
      {
        path: 'tasks/:id',
        loadComponent: () =>
          import('./features/tasks/task-detail/task-detail.component').then(
            (m) => m.TaskDetailComponent
          ),
      },
      {
        path: 'time',
        loadComponent: () =>
          import('./features/time/time-tracking.component').then(
            (m) => m.TimeTrackingComponent
          ),
      },
      {
        path: 'invoices',
        loadComponent: () =>
          import('./features/invoices/invoices.component').then(
            (m) => m.InvoicesComponent
          ),
      },
      {
        path: 'admin/users',
        loadComponent: () =>
          import('./features/admin/users/user-admin.component').then(
            (m) => m.UserAdminComponent
          ),
      },
      {
        path: 'settings',
        loadComponent: () =>
          import('./features/settings/profile/profile-settings.component').then(
            (m) => m.ProfileSettingsComponent
          ),
      },
    ],
  },
  {
    path: '**',
    redirectTo: 'dashboard',
  },
];
