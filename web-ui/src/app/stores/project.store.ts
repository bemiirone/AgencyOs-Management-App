import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, tap, throwError } from 'rxjs';
import { Project } from '../shared/models/project.model';
import { API_CONFIG } from '../core/config/api.config';
import { ToastService } from '../core/services/toast.service';

@Injectable({ providedIn: 'root' })
export class ProjectStore {
  private http = inject(HttpClient);
  private toast = inject(ToastService);

  private _projects = signal<Project[]>([]);
  private _selectedProject = signal<Project | null>(null);
  private _isLoading = signal(false);
  private _error = signal<string | null>(null);

  projects = computed(() => this._projects());
  selectedProject = computed(() => this._selectedProject());
  isLoading = computed(() => this._isLoading());
  error = computed(() => this._error());

  loadProjects() {
    this._isLoading.set(true);
    this._error.set(null);

    return this.http.get<Project[]>(API_CONFIG.PROJECTS.LIST).pipe(
      tap((projects) => {
        this._projects.set(projects);
        this._isLoading.set(false);
      }),
      catchError((error) => {
        this._error.set(error.error?.message || 'Failed to load projects');
        this._isLoading.set(false);
        return throwError(() => error);
      })
    );
  }

  loadProject(id: string) {
    this._isLoading.set(true);
    this._error.set(null);

    return this.http.get<Project>(API_CONFIG.PROJECTS.DETAIL(id)).pipe(
      tap((project) => {
        this._selectedProject.set(project);
        this._isLoading.set(false);
      }),
      catchError((error) => {
        this._error.set(error.error?.message || 'Failed to load project');
        this._isLoading.set(false);
        return throwError(() => error);
      })
    );
  }

  createProject(data: Partial<Project>) {
    this._isLoading.set(true);
    this._error.set(null);

    return this.http.post<Project>(API_CONFIG.PROJECTS.CREATE, data).pipe(
      tap((project) => {
        this._projects.update((projects) => [...projects, project]);
        this._isLoading.set(false);
        this.toast.success('Project created successfully');
      }),
      catchError((error) => {
        this._error.set(error.error?.message || 'Failed to create project');
        this._isLoading.set(false);
        this.toast.error('Failed to create project');
        return throwError(() => error);
      })
    );
  }

  updateProject(id: string, data: Partial<Project>) {
    this._isLoading.set(true);
    this._error.set(null);

    return this.http.patch<Project>(API_CONFIG.PROJECTS.UPDATE(id), data).pipe(
      tap((project) => {
        this._projects.update((projects) =>
          projects.map((p) => (p._id === id ? project : p))
        );
        this._selectedProject.set(project);
        this._isLoading.set(false);
        this.toast.success('Project updated successfully');
      }),
      catchError((error) => {
        this._error.set(error.error?.message || 'Failed to update project');
        this._isLoading.set(false);
        this.toast.error('Failed to update project');
        return throwError(() => error);
      })
    );
  }

  deleteProject(id: string) {
    this._isLoading.set(true);
    this._error.set(null);

    return this.http.delete(API_CONFIG.PROJECTS.DELETE(id)).pipe(
      tap(() => {
        this._projects.update((projects) => projects.filter((p) => p._id !== id));
        this._isLoading.set(false);
        this.toast.success('Project deleted successfully');
      }),
      catchError((error) => {
        this._error.set(error.error?.message || 'Failed to delete project');
        this._isLoading.set(false);
        this.toast.error('Failed to delete project');
        return throwError(() => error);
      })
    );
  }
}
