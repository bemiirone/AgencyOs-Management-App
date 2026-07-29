import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, tap, throwError } from 'rxjs';
import { Task } from '../shared/models/task.model';
import { API_CONFIG } from '../core/config/api.config';
import { ToastService } from '../core/services/toast.service';

@Injectable({ providedIn: 'root' })
export class TaskStore {
  private http = inject(HttpClient);
  private toast = inject(ToastService);

  private _tasks = signal<Task[]>([]);
  private _selectedTask = signal<Task | null>(null);
  private _isLoading = signal(false);
  private _error = signal<string | null>(null);

  tasks = computed(() => this._tasks());
  selectedTask = computed(() => this._selectedTask());
  isLoading = computed(() => this._isLoading());
  error = computed(() => this._error());

  loadTasks() {
    this._isLoading.set(true);
    this._error.set(null);

    return this.http.get<Task[]>(API_CONFIG.TASKS.LIST).pipe(
      tap((tasks) => {
        this._tasks.set(tasks);
        this._isLoading.set(false);
      }),
      catchError((error) => {
        this._error.set(error.error?.message || 'Failed to load tasks');
        this._isLoading.set(false);
        return throwError(() => error);
      })
    );
  }

  loadTasksByProject(projectId: string) {
    this._isLoading.set(true);
    this._error.set(null);

    return this.http.get<Task[]>(API_CONFIG.TASKS.BY_PROJECT(projectId)).pipe(
      tap((tasks) => {
        this._tasks.set(tasks);
        this._isLoading.set(false);
      }),
      catchError((error) => {
        this._error.set(error.error?.message || 'Failed to load tasks');
        this._isLoading.set(false);
        return throwError(() => error);
      })
    );
  }

  loadTask(id: string) {
    this._isLoading.set(true);
    this._error.set(null);

    return this.http.get<Task>(API_CONFIG.TASKS.DETAIL(id)).pipe(
      tap((task) => {
        this._selectedTask.set(task);
        this._isLoading.set(false);
      }),
      catchError((error) => {
        this._error.set(error.error?.message || 'Failed to load task');
        this._isLoading.set(false);
        return throwError(() => error);
      })
    );
  }

  createTask(data: Partial<Task>) {
    this._isLoading.set(true);
    this._error.set(null);

    return this.http.post<Task>(API_CONFIG.TASKS.CREATE, data).pipe(
      tap((task) => {
        this._tasks.update((tasks) => [...tasks, task]);
        this._isLoading.set(false);
        this.toast.success('Task created successfully');
      }),
      catchError((error) => {
        this._error.set(error.error?.message || 'Failed to create task');
        this._isLoading.set(false);
        this.toast.error('Failed to create task');
        return throwError(() => error);
      })
    );
  }

  updateTask(id: string, data: Partial<Task>) {
    this._isLoading.set(true);
    this._error.set(null);

    return this.http.patch<Task>(API_CONFIG.TASKS.UPDATE(id), data).pipe(
      tap((task) => {
        this._tasks.update((tasks) =>
          tasks.map((t) => (t._id === id ? task : t))
        );
        this._selectedTask.set(task);
        this._isLoading.set(false);
        this.toast.success('Task updated successfully');
      }),
      catchError((error) => {
        this._error.set(error.error?.message || 'Failed to update task');
        this._isLoading.set(false);
        this.toast.error('Failed to update task');
        return throwError(() => error);
      })
    );
  }

  updateTaskStatus(id: string, status: Task['status']) {
    this._isLoading.set(true);
    this._error.set(null);

    return this.http.patch<Task>(API_CONFIG.TASKS.UPDATE_STATUS(id), { status }).pipe(
      tap((task) => {
        this._tasks.update((tasks) =>
          tasks.map((t) => (t._id === id ? task : t))
        );
        this._selectedTask.set(task);
        this._isLoading.set(false);
      }),
      catchError((error) => {
        this._error.set(error.error?.message || 'Failed to update task status');
        this._isLoading.set(false);
        this.toast.error('Failed to update task status');
        return throwError(() => error);
      })
    );
  }

  deleteTask(id: string) {
    this._isLoading.set(true);
    this._error.set(null);

    return this.http.delete(API_CONFIG.TASKS.DELETE(id)).pipe(
      tap(() => {
        this._tasks.update((tasks) => tasks.filter((t) => t._id !== id));
        this._isLoading.set(false);
        this.toast.success('Task deleted successfully');
      }),
      catchError((error) => {
        this._error.set(error.error?.message || 'Failed to delete task');
        this._isLoading.set(false);
        this.toast.error('Failed to delete task');
        return throwError(() => error);
      })
    );
  }
}
