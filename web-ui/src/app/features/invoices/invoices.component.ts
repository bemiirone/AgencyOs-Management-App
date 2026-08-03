import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faFileInvoiceDollar } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-invoices',
  standalone: true,
  imports: [CommonModule, FontAwesomeModule],
  templateUrl: './invoices.component.html',
  styleUrl: './invoices.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InvoicesComponent {
  readonly faFileInvoiceDollar = faFileInvoiceDollar;
}
