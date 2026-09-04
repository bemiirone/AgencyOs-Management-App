import { TestBed } from '@angular/core/testing';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { NotificationStore } from './notification.store';
import { API_CONFIG } from '../core/config/api.config';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('NotificationStore', () => {
  let store: NotificationStore;
  let httpMock: HttpTestingController;

  const mockNotification = {
    _id: 'notif-1',
    userId: 'user-1',
    title: 'Test Notification',
    message: 'Test message',
    type: 'email' as const,
    status: 'pending' as const,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        NotificationStore,
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting(),
      ],
    });

    store = TestBed.inject(NotificationStore);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    vi.clearAllMocks();
  });

  describe('loadNotifications', () => {
    it('should load notifications from API', () => {
      const mockNotifications = [mockNotification];

      store.loadNotifications().subscribe((notifications) => {
        expect(notifications).toEqual(mockNotifications);
        expect(store.notifications()).toEqual(mockNotifications);
        expect(store.isLoading()).toBe(false);
      });

      const req = httpMock.expectOne(API_CONFIG.NOTIFICATIONS.LIST);
      expect(req.request.method).toBe('GET');
      req.flush(mockNotifications);
    });

    it('should calculate unread count from pending notifications', () => {
      const notifications = [
        { ...mockNotification, _id: 'notif-1', status: 'pending' as const },
        { ...mockNotification, _id: 'notif-2', status: 'sent' as const },
        { ...mockNotification, _id: 'notif-3', status: 'pending' as const },
      ];

      store.loadNotifications().subscribe(() => {
        expect(store.unreadCount()).toBe(2);
      });

      const req = httpMock.expectOne(API_CONFIG.NOTIFICATIONS.LIST);
      req.flush(notifications);
    });

    it('should set loading state during request', () => {
      store.loadNotifications().subscribe();
      expect(store.isLoading()).toBe(true);

      const req = httpMock.expectOne(API_CONFIG.NOTIFICATIONS.LIST);
      req.flush([]);
      expect(store.isLoading()).toBe(false);
    });

    it('should handle error gracefully', () => {
      store.loadNotifications().subscribe({
        next: () => undefined,
        error: (error) => {
          expect(error.status).toBe(500);
          expect(store.isLoading()).toBe(false);
        },
      });

      const req = httpMock.expectOne(API_CONFIG.NOTIFICATIONS.LIST);
      req.flush({ message: 'Error' }, { status: 500, statusText: 'Error' });
    });
  });

  describe('markAsRead', () => {
    it('should mark a notification as read', () => {
      // First load the notification
      store.loadNotifications().subscribe();
      httpMock.expectOne(API_CONFIG.NOTIFICATIONS.LIST).flush([mockNotification]);

      store.markAsRead('notif-1').subscribe(() => {
        const notif = store.notifications().find((n) => n._id === 'notif-1');
        expect(notif?.status).toBe('sent');
      });

      const req = httpMock.expectOne(API_CONFIG.NOTIFICATIONS.MARK_READ('notif-1'));
      expect(req.request.method).toBe('PATCH');
      req.flush({ ...mockNotification, status: 'sent' as const });
    });

    it('should decrement unread count', () => {
      const notifications = [
        { ...mockNotification, _id: 'notif-1', status: 'pending' as const },
        { ...mockNotification, _id: 'notif-2', status: 'pending' as const },
      ];

      store.loadNotifications().subscribe();
      httpMock.expectOne(API_CONFIG.NOTIFICATIONS.LIST).flush(notifications);

      expect(store.unreadCount()).toBe(2);

      store.markAsRead('notif-1').subscribe(() => {
        expect(store.unreadCount()).toBe(1);
      });

      const req = httpMock.expectOne(API_CONFIG.NOTIFICATIONS.MARK_READ('notif-1'));
      req.flush({ ...mockNotification, status: 'sent' as const });
    });

    it('should not go below zero for unread count', () => {
      store.markAsRead('notif-1').subscribe(() => {
        expect(store.unreadCount()).toBe(0);
      });

      const req = httpMock.expectOne(API_CONFIG.NOTIFICATIONS.MARK_READ('notif-1'));
      req.flush({ ...mockNotification, status: 'sent' as const });
    });

    it('should handle error gracefully', () => {
      store.markAsRead('notif-1').subscribe({
        next: () => undefined,
        error: (error) => {
          expect(error.status).toBe(404);
        },
      });

      const req = httpMock.expectOne(API_CONFIG.NOTIFICATIONS.MARK_READ('notif-1'));
      req.flush({ message: 'Not found' }, { status: 404, statusText: 'Not Found' });
    });
  });
});
