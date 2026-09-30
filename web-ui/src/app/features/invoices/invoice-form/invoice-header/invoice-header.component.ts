import { Component, inject, input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faArrowLeft, faSpinner } from '@fortawesome/free-solid-svg-icons';
import { ContentStore } from '../../../../stores/content.store';

@Component({
  selector: 'app-invoice-header',
  standalone: true,
  imports: [CommonModule, RouterLink, FontAwesomeModule],
  templateUrl: './invoice-header.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InvoiceHeaderComponent {
  readonly content = inject(ContentStore);
  readonly faArrowLeft = faArrowLeft;
  readonly faSpinner = faSpinner;

  loading = input<boolean>(false);
  mode = input<'create' | 'edit'>('create');
  error = input<string>('');
}
