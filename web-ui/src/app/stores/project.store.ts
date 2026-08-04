import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, tap, throwError } from 'rxjs';
import { Project } from '../shared/models/project.model';
import { PaginatedResponse } from '../shared/models/paginated-response.model';
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
  private _total = signal(0);
  private _page = signal(1);
  private _limit = signal(10);
  private _totalPages = signal(0);

  projects = computed(() => this._projects());
  selectedProject = computed(() => this._selectedProject());
  isLoading = computed(() => this._isLoading());
  error = computed(() => this._error());
  total = computed(() => this._total());
  page = computed(() => this._page());
  limit = computed(() => this._limit());
  totalPages = computed(() => this._totalPages());

  loadProjects(page = 1, limit = 10) {
    this._isLoading.set(true);
    this._error.set(null);

    return this.http.get<PaginatedResponse<Project>>(API_CONFIG.PROJECTS.LIST(page, limit)).pipe(
      tap((response) => {
        this._projects.set(response.data);
        this._total.set(response.total);
        this._page.set(response.page);
        this._limit.set(response.limit);
        this._totalPages.set(response.totalPages);
        this._isLoading.set(false);
      }),
      catchError((error) => {
        this._error.set(error.error?.message || 'Failed to load projects');
        this._isLoading.set(false);
        return throwError(() => error);
      })
    );
  }

  loadAllProjects() {
    this._isLoading.set(true);
    this._error.set(null);

    return this.http.get<PaginatedResponse<Project>>(API_CONFIG.PROJECTS.LIST(1, 1000)).pipe(
      tap((response) => {
        this._projects.set(response.data);
        this._total.set(response.total);
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
