import { Component, ChangeDetectionStrategy, inject, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { ContentStore } from '../../../../stores/content.store';
import { FormGroup } from '@angular/forms';

@Component({
  selector: 'app-invoice-billing-type-selector',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './invoice-billing-type-selector.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InvoiceBillingTypeSelectorComponent {
  readonly content = inject(ContentStore);
  form = input.required<FormGroup>();
}
