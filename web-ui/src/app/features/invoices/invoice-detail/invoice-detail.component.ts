import { Component, signal, inject, OnInit, ChangeDetectionStrategy, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faArrowLeft, faSpinner, faEdit, faPaperPlane, faPrint, faCheck } from '@fortawesome/free-solid-svg-icons';
import { InvoiceStore } from '../../../stores/invoice.store';
import { ContentStore } from '../../../stores/content.store';
import { Invoice } from '../../../shared/models/invoice.model';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-invoice-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, FontAwesomeModule, ConfirmDialogComponent],
  templateUrl: './invoice-detail.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InvoiceDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly invoiceStore = inject(InvoiceStore);
  readonly contentStore = inject(ContentStore);

  readonly invoice = signal<Invoice | null>(null);
  readonly loading = signal(false);
  readonly error = signal('');

  readonly faArrowLeft = faArrowLeft;
  readonly faSpinner = faSpinner;
  readonly faEdit = faEdit;
  readonly faPaperPlane = faPaperPlane;
  readonly faPrint = faPrint;
  readonly faCheck = faCheck;

  @ViewChild('confirmDialog') confirmDialog!: ConfirmDialogComponent;
  @ViewChild('markPaidDialog') markPaidDialog!: ConfirmDialogComponent;

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loading.set(true);
      this.invoiceStore.loadInvoice(id).subscribe({
        next: (invoice: Invoice) => {
          this.invoice.set(invoice);
          this.loading.set(false);
        },
        error: () => {
          this.error.set(this.contentStore.content('invoice.detail.error.loadFailed'));
          this.loading.set(false);
        },
      });
    }
  }

  getStatusClass(status: string): string {
    const classes: Record<string, string> = {
      draft: 'badge-ghost',
      sent: 'badge-info',
      paid: 'badge-success',
      overdue: 'badge-error',
      cancelled: 'badge-neutral',
    };
    return classes[status] || 'badge-ghost';
  }

  getStatusLabel(status: string): string {
    const keyMap: Record<string, string> = {
      draft: 'invoice.status.draft',
      sent: 'invoice.status.sent',
      paid: 'invoice.status.paid',
      overdue: 'invoice.status.overdue',
      cancelled: 'invoice.status.cancelled',
    };
    return this.contentStore.content(keyMap[status] || status);
  }

  getBillingTypeLabel(type: string): string {
    const keyMap: Record<string, string> = {
      budget: 'invoice.billingType.budget',
      hourly: 'invoice.billingType.hourly',
      daily: 'invoice.billingType.daily',
      manual: 'invoice.billingType.manual',
    };
    return this.contentStore.content(keyMap[type] || type);
  }

  formatCurrency(amount: number | undefined): string {
    if (amount === undefined) return '£0.00';
    return `£${amount.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  formatDate(date: string | Date | undefined): string {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-GB');
  }

  openSendConfirm(): void {
    this.confirmDialog.open();
  }

  sendInvoice(): void {
    const id = this.invoice()?._id;
    if (!id) return;

    this.invoiceStore.sendInvoice(id).subscribe({
      next: (invoice) => {
        this.invoice.set(invoice);
      },
      error: (err) => console.error('Failed to send invoice:', err),
    });
  }

  openMarkPaidConfirm(): void {
    this.markPaidDialog.open();
  }

  markAsPaid(): void {
    const id = this.invoice()?._id;
    if (!id) return;

    this.invoiceStore.payInvoice(id).subscribe({
      next: (invoice) => {
        this.invoice.set(invoice);
      },
      error: (err) => console.error('Failed to mark invoice as paid:', err),
    });
  }
}
