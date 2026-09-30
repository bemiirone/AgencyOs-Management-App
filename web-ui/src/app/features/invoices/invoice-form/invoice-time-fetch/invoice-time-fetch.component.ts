import { Component, ChangeDetectionStrategy, inject, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faClock } from '@fortawesome/free-solid-svg-icons';
import { ContentStore } from '../../../../stores/content.store';
import { FormGroup } from '@angular/forms';
import { InvoiceTimeEntryTableComponent } from '../invoice-time-entry-table/invoice-time-entry-table.component';
import { InvoiceCalculationSummaryComponent } from '../invoice-calculation-summary/invoice-calculation-summary.component';

@Component({
  selector: 'app-invoice-time-fetch',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FontAwesomeModule, InvoiceTimeEntryTableComponent, InvoiceCalculationSummaryComponent],
  templateUrl: './invoice-time-fetch.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InvoiceTimeFetchComponent {
  readonly content = inject(ContentStore);
  readonly faClock = faClock;

  form = input.required<FormGroup>();
  billingType = input<string>('hourly');
  entries = input<any[]>([]);
  selectedIds = input<Set<string>>(new Set());
  loading = input(false);
  calculationResult = input<any>(null);
  calculationDetails = input<any[]>([]);
  selectedCount = input(0);
  availableOvertime = input(0);
  overtimeExceeds = input(false);
  aggregating = input(false);
  allSelected = input(false);

  toggleEntry = output<string>();
  toggleSelectAll = output<void>();
  calculate = output<void>();
}
