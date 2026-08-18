import { Component, signal, OnInit, inject, ChangeDetectionStrategy, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faPlus, faEye, faEdit, faTrash, faSearch, faSpinner, faPaperPlane } from '@fortawesome/free-solid-svg-icons';
import { Invoice } from '../../shared/models/invoice.model';
import { InvoiceStore } from '../../stores/invoice.store';
import { ProjectStore } from '../../stores/project.store';
import { ContentCardComponent } from '../../shared/components/content-card/content-card.component';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-invoices',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, FontAwesomeModule, ContentCardComponent, ConfirmDialogComponent],
  templateUrl: './invoices.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InvoicesComponent implements OnInit {
  private readonly invoiceStore = inject(InvoiceStore);
  private readonly projectStore = inject(ProjectStore);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly invoices = signal<Invoice[]>([]);
  readonly loading = signal(false);
  readonly searchQuery = signal('');
  readonly statusFilter = signal('');

  readonly faPlus = faPlus;
  readonly faEye = faEye;
  readonly faEdit = faEdit;
  readonly faTrash = faTrash;
  readonly faSearch = faSearch;
  readonly faSpinner = faSpinner;
  readonly faPaperPlane = faPaperPlane;

  @ViewChild('confirmDialog') confirmDialog!: ConfirmDialogComponent;
  readonly pendingInvoiceId = signal<string | null>(null);
  pendingAction: 'delete' | 'send' | null = null;

  ngOnInit(): void {
    const status = this.route.snapshot.queryParams['status'] || '';
    this.statusFilter.set(status);
    this.loadInvoices();
  }

  loadInvoices(): void {
    this.loading.set(true);
    this.invoiceStore.loadInvoices(this.statusFilter() || undefined).subscribe({
      next: (response: Invoice[]) => {
        this.invoices.set(response);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  onStatusFilterChange(): void {
    this.updateQueryParams();
    this.loadInvoices();
  }

  private updateQueryParams(): void {
    const params: Record<string, string> = {};
    if (this.statusFilter()) params.status = this.statusFilter();

    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: params,
      replaceUrl: true,
    });
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
    const labels: Record<string, string> = {
      draft: 'Draft',
      sent: 'Sent',
      paid: 'Paid',
      overdue: 'Overdue',
      cancelled: 'Cancelled',
    };
    return labels[status] || status;
  }

  getBillingTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      budget: 'Budget',
      hourly: 'Hourly',
      daily: 'Daily',
      manual: 'Manual',
    };
    return labels[type] || type;
  }

  formatCurrency(amount: number): string {
    return `£${amount.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  formatDate(date: string | Date | undefined): string {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-GB');
  }

  deleteInvoice(id: string): void {
    this.pendingInvoiceId.set(id);
    this.pendingAction = 'delete';
    this.confirmDialog.open();
  }

  sendInvoice(id: string): void {
    this.pendingInvoiceId.set(id);
    this.pendingAction = 'send';
    this.confirmDialog.open();
  }

  onConfirm(): void {
    const id = this.pendingInvoiceId();
    if (!id) return;
    if (this.pendingAction === 'delete') {
      this.invoiceStore.deleteInvoice(id).subscribe({
        next: () => this.invoices.update((invoices) => invoices.filter((i) => i._id !== id)),
        error: (err: unknown) => console.error('Failed to delete invoice:', err),
      });
    } else if (this.pendingAction === 'send') {
      this.invoiceStore.sendInvoice(id).subscribe({
        next: () => this.loadInvoices(),
        error: (err: unknown) => console.error('Failed to send invoice:', err),
      });
    }
    this.pendingInvoiceId.set(null);
    this.pendingAction = null;
  }

  get filteredInvoices(): Invoice[] {
    const query = this.searchQuery().toLowerCase();
    if (!query) return this.invoices();
    return this.invoices().filter(
      (i) =>
        i.invoiceNumber.toLowerCase().includes(query) ||
        (i.clientName && i.clientName.toLowerCase().includes(query)) ||
        (i.projectName && i.projectName.toLowerCase().includes(query))
    );
  }
}
