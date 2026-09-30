import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { TimeEntryManagerService } from './time-entry-manager.service';
import { InvoiceStore } from '../../../stores/invoice.store';
import { ContentStore } from '../../../stores/content.store';
import { TimeCalculationResult } from '../../../stores/invoice.types';
import { TimeEntry } from '../../../shared/models/time-entry.model';
import { of, throwError } from 'rxjs';
import { describe, it, expect, beforeEach, vi } from 'vitest';

const mockTimeEntries: TimeEntry[] = [
  {
    _id: 'entry-1',
    projectId: 'proj-1',
    taskId: 'task-1',
    description: 'Task 1 work',
    startTime: new Date('2024-01-15T09:00:00'),
    endTime: new Date('2024-01-15T10:00:00'),
    duration: 3600,
    isBillable: true,
    isRunning: false,
    userId: 'user-1',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    _id: 'entry-2',
    projectId: 'proj-1',
    taskId: 'task-2',
    description: 'Task 2 work',
    startTime: new Date('2024-01-16T09:00:00'),
    endTime: new Date('2024-01-16T11:00:00'),
    duration: 7200,
    isBillable: true,
    isRunning: false,
    userId: 'user-1',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

const mockCalculationResult: TimeCalculationResult = {
  totalSeconds: 10800,
  totalHours: 3,
  totalBillableHours: 2.5,
  totalOvertimeHours: 0.5,
  totalDays: 0.375,
  entryCount: 2,
  amount: 300,
  timeEntryIds: ['entry-1', 'entry-2'],
  entries: [
    {
      timeEntryId: 'entry-1',
      description: 'Task 1 work',
      date: '2024-01-15',
      totalHours: 1,
      billableHours: 1,
      overtimeHours: 0,
      calculationMode: 'automatic',
    },
    {
      timeEntryId: 'entry-2',
      description: 'Task 2 work',
      date: '2024-01-16',
      totalHours: 2,
      billableHours: 1.5,
      overtimeHours: 0.5,
      calculationMode: 'automatic',
    },
  ],
};

const mockInvoiceStore = {
  loadTimeEntriesForProject: vi.fn(() => of(mockTimeEntries)),
  calculateTimeEntries: vi.fn(() => of(mockCalculationResult)),
  aggregateTime: vi.fn(() => of(mockCalculationResult)),
};

const mockContentStore = {
  content: vi.fn((key: string) => key),
};

describe('TimeEntryManagerService', () => {
  let service: TimeEntryManagerService;
  let invoiceStore: typeof mockInvoiceStore;
  let contentStore: typeof mockContentStore;

  beforeEach(() => {
    vi.clearAllMocks();

    TestBed.configureTestingModule({
      providers: [
        TimeEntryManagerService,
        { provide: InvoiceStore, useValue: mockInvoiceStore },
        { provide: ContentStore, useValue: mockContentStore },
      ],
    });

    service = TestBed.inject(TimeEntryManagerService);
    invoiceStore = TestBed.inject(InvoiceStore) as any;
    contentStore = TestBed.inject(ContentStore) as any;
  });

  describe('loadTimeEntries', () => {
    it('should load time entries for a project', () => {
      service.loadTimeEntries('proj-1');
      expect(invoiceStore.loadTimeEntriesForProject).toHaveBeenCalledWith('proj-1');
      expect(service.loadingTimeEntries()).toBe(false);
      expect(service.timeEntries()).toEqual(mockTimeEntries);
    });

    it('should clear entries when projectId is empty', () => {
      service.timeEntries.set(mockTimeEntries);
      service.loadTimeEntries('');
      expect(service.timeEntries()).toEqual([]);
      expect(service.selectedEntryIds()).toEqual(new Set());
      expect(service.calculationResult()).toBeNull();
    });

    it('should handle load errors', () => {
      mockInvoiceStore.loadTimeEntriesForProject.mockReturnValue(throwError(() => new Error('Failed')));
      service.loadTimeEntries('proj-1');
      expect(service.loadingTimeEntries()).toBe(false);
    });
  });

  describe('toggleEntry', () => {
    it('should add entry to selection', () => {
      service.toggleEntry('entry-1');
      expect(service.selectedEntryIds().has('entry-1')).toBe(true);
    });

    it('should remove entry from selection', () => {
      service.selectedEntryIds.set(new Set(['entry-1']));
      service.toggleEntry('entry-1');
      expect(service.selectedEntryIds().has('entry-1')).toBe(false);
    });
  });

  describe('toggleSelectAll', () => {
    it('should select all entries', () => {
      service.timeEntries.set(mockTimeEntries);
      service.toggleSelectAll();
      expect(service.selectedEntryIds().size).toBe(2);
      expect(service.allSelected).toBe(true);
    });

    it('should deselect all when all selected', () => {
      service.timeEntries.set(mockTimeEntries);
      service.selectedEntryIds.set(new Set(['entry-1', 'entry-2']));
      service.toggleSelectAll();
      expect(service.selectedEntryIds().size).toBe(0);
    });

    it('should do nothing when no entries', () => {
      service.timeEntries.set([]);
      service.toggleSelectAll();
      expect(service.selectedEntryIds().size).toBe(0);
    });
  });

  describe('isEntrySelected', () => {
    it('should return true for selected entry', () => {
      service.selectedEntryIds.set(new Set(['entry-1']));
      expect(service.isEntrySelected('entry-1')).toBe(true);
    });

    it('should return false for unselected entry', () => {
      service.selectedEntryIds.set(new Set(['entry-1']));
      expect(service.isEntrySelected('entry-2')).toBe(false);
    });
  });

  describe('getEntryDetail', () => {
    it('should return calculation detail for entry', () => {
      service.calculationDetails.set(mockCalculationResult.entries);
      const detail = service.getEntryDetail('entry-1');
      expect(detail).toBeDefined();
      expect(detail?.timeEntryId).toBe('entry-1');
    });

    it('should return undefined for unknown entry', () => {
      service.calculationDetails.set(mockCalculationResult.entries);
      expect(service.getEntryDetail('entry-999')).toBeUndefined();
    });
  });

  describe('clearSelection', () => {
    it('should clear selected entries', () => {
      service.selectedEntryIds.set(new Set(['entry-1']));
      service.clearSelection();
      expect(service.selectedEntryIds().size).toBe(0);
    });
  });

  describe('calculateSelectedEntries', () => {
    let onSuccess: (result: TimeCalculationResult) => void;

    beforeEach(() => {
      onSuccess = vi.fn();
      service.selectedEntryIds.set(new Set(['entry-1', 'entry-2']));
    });

    it('should calculate time entries successfully', () => {
      service.calculateSelectedEntries('hourly', 100, 8, 1.5, onSuccess);

      expect(invoiceStore.calculateTimeEntries).toHaveBeenCalledWith({
        timeEntryIds: ['entry-1', 'entry-2'],
        rateType: 'hourly',
        hourlyRate: 100,
        calculationOptions: { workDayHours: 8, overtimeRate: 1.5 },
      });
      expect(onSuccess).toHaveBeenCalledWith(mockCalculationResult);
      expect(service.aggregatingTime()).toBe(false);
    });

    it('should set error when no entries selected', () => {
      service.selectedEntryIds.set(new Set());
      service.calculateSelectedEntries('hourly', 100, 8, 1.5, onSuccess);

      expect(invoiceStore.calculateTimeEntries).not.toHaveBeenCalled();
      expect(service.error()).toBeTruthy();
    });

    it('should set error when rate is zero', () => {
      service.calculateSelectedEntries('hourly', 0, 8, 1.5, onSuccess);

      expect(invoiceStore.calculateTimeEntries).not.toHaveBeenCalled();
      expect(service.error()).toBeTruthy();
    });

    it('should handle calculation errors', () => {
      mockInvoiceStore.calculateTimeEntries.mockReturnValue(
        throwError(() => ({ error: { message: 'Calculation failed' } }))
      );
      service.calculateSelectedEntries('hourly', 100, 8, 1.5, onSuccess);

      expect(service.error()).toContain('Calculation failed');
      expect(service.aggregatingTime()).toBe(false);
    });
  });

  describe('aggregateTime', () => {
    let onSuccess: (result: TimeCalculationResult) => void;

    beforeEach(() => {
      onSuccess = vi.fn();
    });

    it('should aggregate time successfully', () => {
      service.aggregateTime('proj-1', '2024-01-01', '2024-01-31', 'hourly', 100, onSuccess);

      expect(invoiceStore.aggregateTime).toHaveBeenCalledWith({
        projectId: 'proj-1',
        startDate: new Date('2024-01-01').toISOString(),
        endDate: new Date('2024-01-31').toISOString(),
        rateType: 'hourly',
        rate: 100,
      });
      expect(onSuccess).toHaveBeenCalledWith(mockCalculationResult);
    });

    it('should set error when project ID is missing', () => {
      service.aggregateTime('', '2024-01-01', '2024-01-31', 'hourly', 100, onSuccess);
      expect(invoiceStore.aggregateTime).not.toHaveBeenCalled();
      expect(service.error()).toBeTruthy();
    });

    it('should set error when rate is zero', () => {
      service.aggregateTime('proj-1', '2024-01-01', '2024-01-31', 'hourly', 0, onSuccess);
      expect(invoiceStore.aggregateTime).not.toHaveBeenCalled();
      expect(service.error()).toBeTruthy();
    });

    it('should handle aggregation errors', () => {
      mockInvoiceStore.aggregateTime.mockReturnValue(
        throwError(() => ({ error: { message: 'Aggregation failed' } }))
      );
      service.aggregateTime('proj-1', '2024-01-01', '2024-01-31', 'hourly', 100, onSuccess);

      expect(service.error()).toContain('Aggregation failed');
    });
  });

  describe('availableOvertimeHours', () => {
    it('should return overtime hours from calculation result', () => {
      service.calculationResult.set(mockCalculationResult);
      expect(service.availableOvertimeHours).toBe(0.5);
    });

    it('should return 0 when no calculation result', () => {
      expect(service.availableOvertimeHours).toBe(0);
    });
  });
});
