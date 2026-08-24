import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of, throwError } from 'rxjs';
import { NotificationsComponent } from './notifications.component';
import { AdminApiService } from '../../services/admin-api.service';
import { NotificationSettings } from '../../models/notification-settings.model';
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('NotificationsComponent', () => {
  let component: NotificationsComponent;
  let fixture: ComponentFixture<NotificationsComponent>;
  let adminApiMock: any;
  let snackBarMock: any;

  const mockSettings: NotificationSettings = {
    _id: '1',
    enabled: true,
    projectDueSoon: { enabled: true, titleTemplate: 'Project due', messageTemplate: 'Check project' },
    projectOverdue: { enabled: true, titleTemplate: 'Project overdue', messageTemplate: 'Project is late' },
    taskDueSoon: { enabled: true, titleTemplate: 'Task due', messageTemplate: 'Check task' },
    taskOverdue: { enabled: true, titleTemplate: 'Task overdue', messageTemplate: 'Task is late' },
    invoiceDueSoon: { enabled: true, titleTemplate: 'Invoice due', messageTemplate: 'Pay invoice' },
    invoiceOverdue: { enabled: true, titleTemplate: 'Invoice overdue', messageTemplate: 'Invoice is late' },
    lastRunCount: 5,
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01',
  };

  beforeEach(async () => {
    adminApiMock = {
      getNotificationSettings: vi.fn(),
      updateNotificationSettings: vi.fn(),
    };
    snackBarMock = {
      open: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [NotificationsComponent, MatSnackBarModule, NoopAnimationsModule],
      providers: [
        { provide: AdminApiService, useValue: adminApiMock },
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    })
    .overrideComponent(NotificationsComponent, {
      set: {
        providers: [
          { provide: MatSnackBar, useValue: snackBarMock },
        ],
      },
    })
    .compileComponents();

    fixture = TestBed.createComponent(NotificationsComponent);
    component = fixture.componentInstance;
  });

  describe('Initialization', () => {
    it('should create the component', () => {
      expect(component).toBeTruthy();
    });

    it('should initialize with loading state', () => {
      expect(component.isLoading).toBe(true);
      expect(component.settings).toBeNull();
    });

    it('should define notification type sections', () => {
      expect(component.sections.length).toBe(6);
      expect(component.sections[0].key).toBe('projectDueSoon');
      expect(component.sections[0].label).toBe('Project Due Soon');
    });
  });

  describe('loadSettings()', () => {
    it('should load settings successfully', () => {
      adminApiMock.getNotificationSettings.mockImplementation(() => of(mockSettings));
      component.loadSettings();
      expect(component.settings).not.toBeNull();
      expect(component.isLoading).toBe(false);
    });

    it('should show error on failure', () => {
      adminApiMock.getNotificationSettings.mockImplementation(() => throwError(() => new Error()));
      component.loadSettings();
      expect(snackBarMock.open).toHaveBeenCalledWith('Failed to load notification settings', 'Close', { duration: 3000 });
      expect(component.isLoading).toBe(false);
    });

    it('should apply defaults for missing sections', () => {
      const partialSettings: NotificationSettings = {
        ...mockSettings,
        projectDueSoon: undefined as any,
        taskOverdue: undefined as any,
      };
      adminApiMock.getNotificationSettings.mockImplementation(() => of(partialSettings));
      component.loadSettings();
      expect(component.settings!.projectDueSoon).toBeDefined();
      expect(component.settings!.taskOverdue).toBeDefined();
    });
  });

  describe('saveSettings()', () => {
    it('should not save when settings is null', () => {
      component.settings = null;
      component.saveSettings();
      expect(adminApiMock.updateNotificationSettings).not.toHaveBeenCalled();
    });

    it('should save settings when valid', () => {
      component.settings = mockSettings;
      adminApiMock.updateNotificationSettings.mockImplementation(() => of(mockSettings));
      component.saveSettings();
      expect(adminApiMock.updateNotificationSettings).toHaveBeenCalledWith(mockSettings);
    });

    it('should show success message on save', () => {
      component.settings = mockSettings;
      adminApiMock.updateNotificationSettings.mockImplementation(() => of(mockSettings));
      component.saveSettings();
      expect(snackBarMock.open).toHaveBeenCalledWith('Notification settings saved', 'Close', { duration: 3000 });
    });

    it('should show error message on save failure', () => {
      component.settings = mockSettings;
      adminApiMock.updateNotificationSettings.mockImplementation(() => throwError(() => new Error()));
      component.saveSettings();
      expect(snackBarMock.open).toHaveBeenCalledWith('Failed to save notification settings', 'Close', { duration: 3000 });
    });

    it('should reset isSaving on success', () => {
      component.settings = mockSettings;
      adminApiMock.updateNotificationSettings.mockImplementation(() => of(mockSettings));
      component.saveSettings();
      expect(component.isSaving).toBe(false);
    });

    it('should reset isSaving on error', () => {
      component.settings = mockSettings;
      adminApiMock.updateNotificationSettings.mockImplementation(() => throwError(() => new Error()));
      component.saveSettings();
      expect(component.isSaving).toBe(false);
    });
  });

  describe('resetToDefaults()', () => {
    it('should not reset when settings is null', () => {
      component.settings = null;
      component.resetToDefaults(component.sections[0]);
      expect(component.settings).toBeNull();
    });

    it('should reset section to defaults', () => {
      component.settings = {
        ...mockSettings,
        projectDueSoon: { enabled: false, titleTemplate: 'Custom', messageTemplate: 'Custom' },
      };
      component.resetToDefaults(component.sections[0]);
      expect(component.settings!.projectDueSoon.enabled).toBe(true);
    });
  });

  describe('formatLastRun()', () => {
    it('should return "Never" when date is undefined', () => {
      expect(component.formatLastRun()).toBe('Never');
    });

    it('should return "Never" when date is empty', () => {
      expect(component.formatLastRun('')).toBe('Never');
    });

    it('should return formatted date string', () => {
      const result = component.formatLastRun('2024-06-15T10:30:00Z');
      expect(result).toContain('2024');
    });
  });
});
