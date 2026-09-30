import { Component, ChangeDetectionStrategy, inject, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormArray } from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faPlus, faTrash } from '@fortawesome/free-solid-svg-icons';
import { ContentStore } from '../../../../stores/content.store';
import { FormGroup } from '@angular/forms';

@Component({
  selector: 'app-invoice-expenses',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FontAwesomeModule],
  templateUrl: './invoice-expenses.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InvoiceExpensesComponent {
  readonly content = inject(ContentStore);
  readonly faPlus = faPlus;
  readonly faTrash = faTrash;

  expenses = input.required<FormArray>();
  form = input.required<FormGroup>();

  add = output<void>();
  remove = output<number>();
  clear = output<void>();
  updateTotals = output<void>();
}
