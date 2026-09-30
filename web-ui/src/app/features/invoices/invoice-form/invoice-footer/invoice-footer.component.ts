import { Component, ChangeDetectionStrategy, inject, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faSave, faSpinner } from '@fortawesome/free-solid-svg-icons';
import { ContentStore } from '../../../../stores/content.store';
import { FormGroup } from '@angular/forms';

@Component({
  selector: 'app-invoice-footer',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, FontAwesomeModule],
  templateUrl: './invoice-footer.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InvoiceFooterComponent {
  readonly content = inject(ContentStore);
  readonly faSave = faSave;
  readonly faSpinner = faSpinner;

  form = input.required<FormGroup>();
  saving = input(false);
  mode = input<'create' | 'edit'>('create');
  invoiceId = input('');
  total = input(0);
  billingType = input<string>('budget');

  submit = output<void>();

  billingTypeIsManual(): boolean {
    return this.billingType() === 'manual';
  }
}
