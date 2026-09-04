import { TestBed } from '@angular/core/testing';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { TimeEntryStore } from './time-entry.store';
import { ToastService } from '../core/services/toast.service';
import { API_CONFIG } from '../core/config/api.config';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('TimeEntryStore', () => {
  let store: TimeEntryStore;
  let httpMock: HttpTestingController;
  let toastMock: { success: any; error: any; info: any; warning: any };

  const mockTimeEntry = {
    _id: 'entry-1',
    description: 'Test entry',
    projectId: 'project-1',
    projectName: 'Test Project',
    taskId: 'task-1',
    taskTitle: 'Test Task',
    userId: 'user-1',
    userName: 'Test User',
    startTime: new Date(),
    endTime: new Date(),
    duration: 3600,
    isBillable: true,
    isRunning: false,
    hourlyRate: 50,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    toastMock = {
      success: vi.fn(),
      error: vi.fn(),
      info: vi.fn(),
      warning: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        TimeEntryStore,
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting(),
        { provide: ToastService, useValue: toastMock },
      ],
    });

    store = TestBed.inject(TimeEntryStore);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    vi.clearAllMocks();
  });

  describe('loadEntries', () => {
    it('should load all time entries', () => {
      const mockEntries = [mockTimeEntry];

      store.loadEntries().subscribe((entries) => {
        expect(entries).toEqual(mockEntries);
        expect(store.entries()).toEqual(mockEntries);
        expect(store.isLoading()).toBe(false);
      });

      const req = httpMock.expectOne(API_CONFIG.TIME_ENTRIES.LIST);
      expect(req.request.method).toBe('GET');
      req.flush(mockEntries);
    });

    it('should load entries for a specific user', () => {
      const userId = 'user-1';
      const mockEntries = [mockTimeEntry];

      store.loadEntries(userId).subscribe((entries) => {
        expect(entries).toEqual(mockEntries);
      });

      const req = httpMock.expectOne(`${API_CONFIG.TIME_ENTRIES.LIST}?userId=${userId}`);
      expect(req.request.method).toBe('GET');
      req.flush(mockEntries);
    });

    it('should set error on failure', () => {
      store.loadEntries().subscribe({
        next: () => undefined,
        error: () => {
          expect(store.isLoading()).toBe(false);
        },
      });

      const req = httpMock.expectOne(API_CONFIG.TIME_ENTRIES.LIST);
      req.flush({ message: 'Error' }, { status: 500, statusText: 'Error' });
    });
  });

  describe('loadEntriesByProject', () => {
    it('should load entries for a specific project', () => {
      const projectId = 'project-1';
      const mockEntries = [mockTimeEntry];

      store.loadEntriesByProject(projectId).subscribe((entries) => {
        expect(entries).toEqual(mockEntries);
      });

      const req = httpMock.expectOne(API_CONFIG.TIME_ENTRIES.BY_PROJECT(projectId));
      expect(req.request.method).toBe('GET');
      req.flush(mockEntries);
    });
  });

  describe('loadEntriesByTask', () => {
    it('should load entries for a specific task', () => {
      const taskId = 'task-1';
      const mockEntries = [mockTimeEntry];

      store.loadEntriesByTask(taskId).subscribe((entries) => {
        expect(entries).toEqual(mockEntries);
      });

      const req = httpMock.expectOne(API_CONFIG.TIME_ENTRIES.BY_TASK(taskId));
      expect(req.request.method).toBe('GET');
      req.flush(mockEntries);
    });
  });

  describe('getRunningEntry', () => {
    it('should get the running time entry', () => {
      const runningEntry = { ...mockTimeEntry, isRunning: true };

      store.getRunningEntry().subscribe((entry) => {
        expect(entry).toEqual(runningEntry);
        expect(store.runningEntry()).toEqual(runningEntry);
      });

      const req = httpMock.expectOne(API_CONFIG.TIME_ENTRIES.RUNNING);
      expect(req.request.method).toBe('GET');
      req.flush(runningEntry);
    });

    it('should not update runningEntry if null', () => {
      store.getRunningEntry().subscribe((entry) => {
        expect(entry).toBeNull();
      });

      const req = httpMock.expectOne(API_CONFIG.TIME_ENTRIES.RUNNING);
      req.flush(null);
    });
  });

  describe('startTimer', () => {
    it('should start a timer and show success toast', () => {
      const startData = { projectId: 'project-1', description: 'Test', isBillable: true };
      const newEntry = { ...mockTimeEntry, isRunning: true };

      store.startTimer(startData).subscribe((entry) => {
        expect(entry.isRunning).toBe(true);
        expect(store.runningEntry()).toEqual(newEntry);
        expect(store.entries()).toContain(newEntry);
        expect(toastMock.info).toHaveBeenCalledWith('Timer started');
      });

      const req = httpMock.expectOne(API_CONFIG.TIME_ENTRIES.CREATE);
      expect(req.request.method).toBe('POST');
      req.flush(newEntry);
    });

    it('should show error toast on failure', () => {
      store.startTimer({ projectId: 'project-1' }).subscribe({
        next: () => undefined,
        error: () => {
          expect(toastMock.error).toHaveBeenCalledWith('Failed to start timer');
        },
      });

      const req = httpMock.expectOne(API_CONFIG.TIME_ENTRIES.CREATE);
      req.flush({ message: 'Error' }, { status: 400, statusText: 'Bad Request' });
    });
  });

  describe('stopTimer', () => {
    it('should stop a timer and show success toast', () => {
      const stoppedEntry = { ...mockTimeEntry, isRunning: false, duration: 7200 };

      store.stopTimer('entry-1').subscribe((entry) => {
        expect(entry.isRunning).toBe(false);
        expect(store.runningEntry()).toBeNull();
        expect(toastMock.success).toHaveBeenCalledWith('Timer stopped — 2h 0m');
      });

      const req = httpMock.expectOne(API_CONFIG.TIME_ENTRIES.STOP('entry-1'));
      expect(req.request.method).toBe('POST');
      req.flush(stoppedEntry);
    });

    it('should show error toast on failure', () => {
      store.stopTimer('entry-1').subscribe({
        next: () => undefined,
        error: () => {
          expect(toastMock.error).toHaveBeenCalledWith('Failed to stop timer');
        },
      });

      const req = httpMock.expectOne(API_CONFIG.TIME_ENTRIES.STOP('entry-1'));
      req.flush({ message: 'Error' }, { status: 400, statusText: 'Bad Request' });
    });
  });

  describe('deleteEntry', () => {
    it('should delete a time entry and show success toast', () => {
      store.deleteEntry('entry-1').subscribe(() => {
        expect(store.entries().filter((e) => e._id === 'entry-1')).toHaveLength(0);
        expect(toastMock.success).toHaveBeenCalledWith('Time entry deleted');
      });

      const req = httpMock.expectOne(API_CONFIG.TIME_ENTRIES.DELETE('entry-1'));
      expect(req.request.method).toBe('DELETE');
      req.flush({ success: true });
    });

    it('should clear runningEntry if deleted entry is running', () => {
      store.deleteEntry('entry-1').subscribe(() => {
        expect(store.runningEntry()).toBeNull();
      });

      const req = httpMock.expectOne(API_CONFIG.TIME_ENTRIES.DELETE('entry-1'));
      req.flush({ success: true });
    });

    it('should show error toast on failure', () => {
      store.deleteEntry('entry-1').subscribe({
        next: () => undefined,
        error: () => {
          expect(toastMock.error).toHaveBeenCalledWith('Failed to delete time entry');
        },
      });

      const req = httpMock.expectOne(API_CONFIG.TIME_ENTRIES.DELETE('entry-1'));
      req.flush({ message: 'Error' }, { status: 400, statusText: 'Bad Request' });
    });
  });

  describe('cleanupOrphanedTimers', () => {
    it('should cleanup orphaned timers', () => {
      store.cleanupOrphanedTimers().subscribe((result) => {
        expect(result.cleaned).toBe(2);
      });

      const req = httpMock.expectOne(API_CONFIG.TIME_ENTRIES.CLEANUP_ORPHANED);
      expect(req.request.method).toBe('POST');
      req.flush({ cleaned: 2 });
    });
  });

  describe('cleanupAllOrphanedTimers', () => {
    it('should cleanup all orphaned timers', () => {
      store.cleanupAllOrphanedTimers().subscribe((result) => {
        expect(result.cleaned).toBe(5);
      });

      const req = httpMock.expectOne(API_CONFIG.TIME_ENTRIES.CLEANUP_ALL_ORPHANED);
      expect(req.request.method).toBe('POST');
      req.flush({ cleaned: 5 });
    });
  });

  describe('formatDuration', () => {
    it('should format seconds to HH:MM:SS', () => {
      expect(store.formatDuration(3661)).toBe('01:01:01');
    });

    it('should format zero seconds', () => {
      expect(store.formatDuration(0)).toBe('00:00:00');
    });

    it('should format hours only', () => {
      expect(store.formatDuration(7200)).toBe('02:00:00');
    });
  });

  describe('formatDurationShort', () => {
    it('should format to hours and minutes', () => {
      expect(store.formatDurationShort(7200)).toBe('2h 0m');
    });

    it('should format to minutes only when less than an hour', () => {
      expect(store.formatDurationShort(1800)).toBe('30m');
    });
  });
});
