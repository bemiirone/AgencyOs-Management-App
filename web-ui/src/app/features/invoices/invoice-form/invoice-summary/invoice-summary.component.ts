import { Component, ChangeDetectionStrategy, inject, input, output } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { ContentStore } from '../../../../stores/content.store';

@Component({
  selector: 'app-invoice-summary',
  standalone: true,
  imports: [CommonModule, CurrencyPipe],
  templateUrl: './invoice-summary.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InvoiceSummaryComponent {
  readonly content = inject(ContentStore);

  billingType = input<string>('budget');
  billableAmount = input(0);
  overtimeAmount = input(0);
  overtimeHours = input(0);
  overtimeRate = input(0);
  expensesTotal = input(0);
  subtotal = input(0);
}
