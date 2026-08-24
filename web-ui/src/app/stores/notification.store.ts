import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, tap, throwError } from 'rxjs';
import { Notification } from '../shared/models/notification.model';
import { API_CONFIG } from '../core/config/api.config';

@Injectable({ providedIn: 'root' })
export class NotificationStore {
  private http = inject(HttpClient);

  private _notifications = signal<Notification[]>([]);
  private _unreadCount = signal(0);
  private _isLoading = signal(false);

  notifications = computed(() => this._notifications());
  unreadCount = computed(() => this._unreadCount());
  isLoading = computed(() => this._isLoading());

  loadNotifications() {
    this._isLoading.set(true);

    return this.http.get<Notification[]>(API_CONFIG.NOTIFICATIONS.LIST).pipe(
      tap((notifications) => {
        this._notifications.set(notifications.filter((n) => n.status === 'pending'));
        this._unreadCount.set(notifications.filter((n) => n.status === 'pending').length);
        this._isLoading.set(false);
      }),
      catchError((error) => {
        this._isLoading.set(false);
        return throwError(() => error);
      })
    );
  }

  markAsRead(id: string) {
    return this.http.patch<Notification>(API_CONFIG.NOTIFICATIONS.MARK_READ(id), {}).pipe(
      tap(() => {
        this._notifications.update((notifications) =>
          notifications.map((n) => (n._id === id ? { ...n, status: 'sent' as const } : n))
        );
        this._unreadCount.update((count) => Math.max(0, count - 1));
      }),
      catchError((error) => {
        return throwError(() => error);
      })
    );
  }
}
