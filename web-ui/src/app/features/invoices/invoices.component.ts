import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faFileInvoiceDollar } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-invoices',
  standalone: true,
  imports: [CommonModule, FontAwesomeModule],
  templateUrl: './invoices.component.html',
  styleUrl: './invoices.component.css',
})
export class InvoicesComponent {
  faFileInvoiceDollar = faFileInvoiceDollar;
}
