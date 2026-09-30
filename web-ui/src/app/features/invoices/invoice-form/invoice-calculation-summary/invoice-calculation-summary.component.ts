import { Component, ChangeDetectionStrategy, inject, input, output } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faClock, faSpinner } from '@fortawesome/free-solid-svg-icons';
import { ContentStore } from '../../../../stores/content.store';
import { TimeCalculationResult } from '../../../../stores/invoice.types';
import { FormGroup } from '@angular/forms';

@Component({
  selector: 'app-invoice-calculation-summary',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, CurrencyPipe, FontAwesomeModule],
  templateUrl: './invoice-calculation-summary.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InvoiceCalculationSummaryComponent {
  readonly content = inject(ContentStore);
  readonly faClock = faClock;
  readonly faSpinner = faSpinner;

  form = input.required<FormGroup>();
  billingType = input<string>('hourly');
  calculationResult = input<TimeCalculationResult | null>(null);
  selectedCount = input(0);
  availableOvertime = input(0);
  overtimeExceeds = input(false);
  aggregating = input(false);

  calculate = output<void>();
}
