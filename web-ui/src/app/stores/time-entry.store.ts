import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, tap, throwError } from 'rxjs';
import { TimeEntry } from '../shared/models/time-entry.model';
import { API_CONFIG } from '../core/config/api.config';
import { ToastService } from '../core/services/toast.service';
import { WebSocketService } from '../core/services/websocket.service';

@Injectable({ providedIn: 'root' })
export class TimeEntryStore {
  private http = inject(HttpClient);
  private toast = inject(ToastService);
  private ws = inject(WebSocketService);

  private _entries = signal<TimeEntry[]>([]);
  private _runningEntry = signal<TimeEntry | null>(null);
  private _isLoading = signal(false);
  private _error = signal<string | null>(null);
  private _elapsedSeconds = signal(0);

  entries = computed(() => this._entries());
  runningEntry = computed(() => this._runningEntry());
  isLoading = computed(() => this._isLoading());
  error = computed(() => this._error());
  elapsedSeconds = computed(() => this._elapsedSeconds());

  constructor() {
    this.ws.on<{ timeEntryId: string; elapsed: number }>('timerTick', (data) => {
      if (this._runningEntry()?._id === data.timeEntryId) {
        this._elapsedSeconds.set(data.elapsed);
      }
    });

    this.ws.on<{ timeEntryId: string; duration: number }>('timerStopped', (data) => {
      if (this._runningEntry()?._id === data.timeEntryId) {
        this._runningEntry.set(null);
        this._elapsedSeconds.set(0);
        this._entries.update((entries) =>
          entries.map((e) =>
            e._id === data.timeEntryId ? { ...e, isRunning: false, duration: data.duration } : e
          )
        );
      }
    });
  }

  loadEntries(userId?: string) {
    this._isLoading.set(true);
    this._error.set(null);

    const url = userId
      ? `${API_CONFIG.TIME_ENTRIES.LIST}?userId=${userId}`
      : API_CONFIG.TIME_ENTRIES.LIST;

    return this.http.get<TimeEntry[]>(url).pipe(
      tap((entries) => {
        this._entries.set(entries);
        this._isLoading.set(false);
      }),
      catchError((error) => {
        this._error.set(error.error?.message || 'Failed to load time entries');
        this._isLoading.set(false);
        return throwError(() => error);
      })
    );
  }

  loadEntriesByProject(projectId: string) {
    this._isLoading.set(true);
    this._error.set(null);

    return this.http.get<TimeEntry[]>(API_CONFIG.TIME_ENTRIES.BY_PROJECT(projectId)).pipe(
      tap((entries) => {
        this._entries.set(entries);
        this._isLoading.set(false);
      }),
      catchError((error) => {
        this._error.set(error.error?.message || 'Failed to load time entries');
        this._isLoading.set(false);
        return throwError(() => error);
      })
    );
  }

  loadEntriesByTask(taskId: string) {
    this._isLoading.set(true);
    this._error.set(null);

    return this.http.get<TimeEntry[]>(API_CONFIG.TIME_ENTRIES.BY_TASK(taskId)).pipe(
      tap((entries) => {
        this._entries.set(entries);
        this._isLoading.set(false);
      }),
      catchError((error) => {
        this._error.set(error.error?.message || 'Failed to load time entries');
        this._isLoading.set(false);
        return throwError(() => error);
      })
    );
  }

  getRunningEntry() {
    return this.http.get<TimeEntry | null>(API_CONFIG.TIME_ENTRIES.RUNNING).pipe(
      tap((entry) => {
        if (entry) {
          this._runningEntry.set(entry);
        }
      }),
      catchError((error) => {
        return throwError(() => error);
      })
    );
  }

  cleanupOrphanedTimers() {
    return this.http.post<{ cleaned: number }>(API_CONFIG.TIME_ENTRIES.CLEANUP_ORPHANED, {}).pipe(
      catchError((error) => {
        return throwError(() => error);
      })
    );
  }

  cleanupAllOrphanedTimers() {
    return this.http.post<{ cleaned: number }>(API_CONFIG.TIME_ENTRIES.CLEANUP_ALL_ORPHANED, {}).pipe(
      catchError((error) => {
        return throwError(() => error);
      })
    );
  }

  startTimer(data: { projectId: string; taskId?: string; description?: string; isBillable?: boolean }) {
    this._isLoading.set(true);
    this._error.set(null);

    return this.http.post<TimeEntry>(API_CONFIG.TIME_ENTRIES.CREATE, data).pipe(
      tap((entry) => {
        this._runningEntry.set(entry);
        this._entries.update((entries) => [entry, ...entries]);
        this._isLoading.set(false);
        this._elapsedSeconds.set(0);
        this.toast.info('Timer started');
        this.ws.emit('startTimer', { timeEntryId: entry._id });
      }),
      catchError((error) => {
        this._error.set(error.error?.message || 'Failed to start timer');
        this._isLoading.set(false);
        this.toast.error('Failed to start timer');
        return throwError(() => error);
      })
    );
  }

  stopTimer(id: string) {
    this._isLoading.set(true);
    this._error.set(null);

    this.ws.emit('stopTimer', { timeEntryId: id });

    return this.http.post<TimeEntry>(API_CONFIG.TIME_ENTRIES.STOP(id), {}).pipe(
      tap((entry) => {
        this._runningEntry.set(null);
        this._elapsedSeconds.set(0);
        this._entries.update((entries) =>
          entries.map((e) => (e._id === id ? entry : e))
        );
        this._isLoading.set(false);
        this.toast.success(`Timer stopped — ${this.formatDurationShort(entry.duration)}`);
      }),
      catchError((error) => {
        this._error.set(error.error?.message || 'Failed to stop timer');
        this._isLoading.set(false);
        this.toast.error('Failed to stop timer');
        return throwError(() => error);
      })
    );
  }

  deleteEntry(id: string) {
    this._isLoading.set(true);
    this._error.set(null);

    return this.http.delete(API_CONFIG.TIME_ENTRIES.DELETE(id)).pipe(
      tap(() => {
        this._entries.update((entries) => entries.filter((e) => e._id !== id));
        if (this._runningEntry()?._id === id) {
          this._runningEntry.set(null);
        }
        this._isLoading.set(false);
        this.toast.success('Time entry deleted');
      }),
      catchError((error) => {
        this._error.set(error.error?.message || 'Failed to delete time entry');
        this._isLoading.set(false);
        this.toast.error('Failed to delete time entry');
        return throwError(() => error);
      })
    );
  }

  formatDuration(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  formatDurationShort(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  }
}
