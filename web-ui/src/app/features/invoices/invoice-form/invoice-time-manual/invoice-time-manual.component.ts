import { Component, ChangeDetectionStrategy, inject, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faClock } from '@fortawesome/free-solid-svg-icons';
import { ContentStore } from '../../../../stores/content.store';
import { FormGroup } from '@angular/forms';

@Component({
  selector: 'app-invoice-time-manual',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FontAwesomeModule],
  templateUrl: './invoice-time-manual.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InvoiceTimeManualComponent {
  readonly content = inject(ContentStore);
  readonly faClock = faClock;

  form = input.required<FormGroup>();
  billingType = input<string>('hourly');
}
