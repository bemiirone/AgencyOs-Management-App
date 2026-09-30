import { Injectable, inject, signal } from '@angular/core';
import { TimeEntry } from '../../../shared/models/time-entry.model';
import { TimeEntryCalculationDetail } from '../../../shared/models/invoice.model';
import { TimeCalculationResult } from '../../../stores/invoice.types';
import { InvoiceStore } from '../../../stores/invoice.store';
import { ContentStore } from '../../../stores/content.store';

@Injectable({ providedIn: 'root' })
export class TimeEntryManagerService {
  private readonly invoiceStore = inject(InvoiceStore);
  private readonly contentStore = inject(ContentStore);

  readonly timeEntries = signal<TimeEntry[]>([]);
  readonly selectedEntryIds = signal<Set<string>>(new Set());
  readonly loadingTimeEntries = signal(false);
  readonly calculationResult = signal<TimeCalculationResult | null>(null);
  readonly calculationDetails = signal<TimeEntryCalculationDetail[]>([]);
  readonly aggregatingTime = signal(false);
  readonly timeInputMode = signal<'fetch' | 'manual'>('fetch');
  readonly error = signal('');

  loadTimeEntries(projectId: string): void {
    if (!projectId) {
      this.timeEntries.set([]);
      this.selectedEntryIds.set(new Set());
      this.calculationResult.set(null);
      this.calculationDetails.set([]);
      return;
    }

    this.loadingTimeEntries.set(true);
    this.invoiceStore.loadTimeEntriesForProject(projectId).subscribe({
      next: (entries) => {
        this.timeEntries.set(entries);
        this.loadingTimeEntries.set(false);
      },
      error: () => {
        this.loadingTimeEntries.set(false);
      },
    });
  }

  toggleEntry(entryId: string): void {
    const current = new Set(this.selectedEntryIds());
    if (current.has(entryId)) {
      current.delete(entryId);
    } else {
      current.add(entryId);
    }
    this.selectedEntryIds.set(current);
  }

  toggleSelectAll(): void {
    const entries = this.timeEntries();
    if (entries.length === 0) return;

    if (this.allSelected) {
      this.selectedEntryIds.set(new Set());
    } else {
      this.selectedEntryIds.set(new Set(entries.map((e) => e._id)));
    }
  }

  isEntrySelected(entryId: string): boolean {
    return this.selectedEntryIds().has(entryId);
  }

  getEntryDetail(entryId: string): TimeEntryCalculationDetail | undefined {
    return this.calculationDetails().find((d) => d.timeEntryId === entryId);
  }

  get allSelected(): boolean {
    const entries = this.timeEntries();
    if (entries.length === 0) return false;
    return this.selectedEntryIds().size === entries.length;
  }

  get selectedCount(): number {
    return this.selectedEntryIds().size;
  }

  get availableOvertimeHours(): number {
    return this.calculationResult()?.totalOvertimeHours || 0;
  }

  clearSelection(): void {
    this.selectedEntryIds.set(new Set());
  }

  validateRateForAggregation(rate: number): boolean {
    if (!rate) {
      this.error.set(this.contentStore.content('invoice.form.error.enterRate'));
      return false;
    }
    this.aggregatingTime.set(true);
    this.error.set('');
    return true;
  }

  validateSelectedEntries(): boolean {
    const selectedIds = Array.from(this.selectedEntryIds());
    if (selectedIds.length === 0) {
      this.error.set(this.contentStore.content('invoice.form.error.selectEntries'));
      return false;
    }
    return true;
  }

  calculateSelectedEntries(
    rateType: 'hourly' | 'daily',
    rate: number,
    workDayHours: number,
    overtimeRate: number,
    onSuccess?: (result: TimeCalculationResult) => void
  ): void {
    if (!this.validateSelectedEntries()) return;
    if (!this.validateRateForAggregation(rate)) return;

    const selectedIds = Array.from(this.selectedEntryIds());

    this.invoiceStore.calculateTimeEntries({
      timeEntryIds: selectedIds,
      rateType,
      hourlyRate: rateType === 'hourly' ? rate : undefined,
      dailyRate: rateType === 'daily' ? rate : undefined,
      calculationOptions: {
        workDayHours,
        overtimeRate,
      },
    }).subscribe({
      next: (result) => {
        this.calculationResult.set(result);
        this.calculationDetails.set(result.entries);
        this.aggregatingTime.set(false);
        onSuccess?.(result);
      },
      error: (err) => {
        const error = err as { error?: { message?: string } };
        this.error.set(error.error?.message || 'Failed to calculate time entries');
        this.aggregatingTime.set(false);
      },
    });
  }

  aggregateTime(
    projectId: string,
    startDate: string,
    endDate: string,
    rateType: 'hourly' | 'daily',
    rate: number,
    onSuccess?: (result: TimeCalculationResult) => void
  ): void {
    if (!projectId || !startDate || !endDate) {
      this.error.set(this.contentStore.content('invoice.form.error.selectProjectDate'));
      return;
    }

    if (!this.validateRateForAggregation(rate)) return;

    this.invoiceStore.aggregateTime({
      projectId,
      startDate: new Date(startDate).toISOString(),
      endDate: new Date(endDate).toISOString(),
      rateType,
      rate,
    }).subscribe({
      next: (result) => {
        this.aggregatingTime.set(false);
        onSuccess?.(result);
      },
      error: (err) => {
        const error = err as { error?: { message?: string } };
        this.error.set(error.error?.message || 'Failed to aggregate time');
        this.aggregatingTime.set(false);
      },
    });
  }
}
