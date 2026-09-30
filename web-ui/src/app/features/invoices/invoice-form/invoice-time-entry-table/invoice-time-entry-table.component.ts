import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faCheckSquare, faSquare, faClock, faSpinner } from '@fortawesome/free-solid-svg-icons';
import { TimeEntry } from '../../../../shared/models/time-entry.model';
import { TimeEntryCalculationDetail } from '../../../../shared/models/invoice.model';
import { TimeCalculationResult } from '../../../../stores/invoice.types';

@Component({
  selector: 'app-invoice-time-entry-table',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FontAwesomeModule],
  templateUrl: './invoice-time-entry-table.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InvoiceTimeEntryTableComponent {
  readonly faClock = faClock;
  readonly faSpinner = faSpinner;
  readonly faCheckSquare = faCheckSquare;
  readonly faSquare = faSquare;

  form = input.required<any>();
  entries = input<TimeEntry[]>([]);
  selectedIds = input<Set<string>>(new Set());
  loading = input(false);
  billingType = input<string>('hourly');
  calculationResult = input<TimeCalculationResult | null>(null);
  calculationDetails = input<TimeEntryCalculationDetail[]>([]);
  allSelected = input(false);

  toggle = output<string>();
  toggleAll = output<void>();

  isRateInvalid(): boolean {
    const form = this.form();
    const field = this.billingType() === 'hourly' ? 'hourlyRate' : 'dailyRate';
    return form.get(field)?.touched && !form.get(field)?.value;
  }

  showBillable(): boolean {
    return this.billingType() === 'hourly' || this.billingType() === 'daily';
  }

  getDetail(entryId: string): TimeEntryCalculationDetail | undefined {
    return this.calculationDetails().find((d) => d.timeEntryId === entryId);
  }

  formatDate(date: Date | string): string {
    return new Date(date).toLocaleDateString();
  }

  formatDuration(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  }
}
