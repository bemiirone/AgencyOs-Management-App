import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, tap, throwError } from 'rxjs';
import { Invoice, TimeAggregationResult } from '../shared/models/invoice.model';
import { API_CONFIG } from '../core/config/api.config';
import { ToastService } from '../core/services/toast.service';

interface ErrorResponse {
  error?: {
    message?: string;
  };
}

export interface CreateInvoicePayload {
  projectId: string;
  clientId: string;
  clientName: string;
  clientEmail: string;
  billingType?: 'budget' | 'hourly' | 'daily' | 'manual';
  lineItems?: Array<{ description: string; quantity: number; rate: number; amount: number }>;
  paymentStages?: Array<{ name: string; percentage: number; dueDate?: string }>;
  expenses?: Array<{ description: string; amount: number; date?: string }>;
  dateRange?: { startDate: string; endDate: string };
  hourlyRate?: number;
  dailyRate?: number;
  totalHours?: number;
  totalDays?: number;
  manualHours?: number;
  manualDays?: number;
  subtotal: number;
  amount: number;
  tax?: number;
  dueDate?: string;
  timeEntryIds?: string[];
  taskIds?: string[];
  notes?: string;
}

export interface UpdateInvoicePayload {
  status?: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  billingType?: 'budget' | 'hourly' | 'daily' | 'manual';
  lineItems?: Array<{ description: string; quantity: number; rate: number; amount: number }>;
  paymentStages?: Array<{ name: string; percentage: number; dueDate?: string }>;
  expenses?: Array<{ description: string; amount: number; date?: string }>;
  subtotal?: number;
  amount?: number;
  tax?: number;
  total?: number;
  dueDate?: string;
  notes?: string;
}

@Injectable({ providedIn: 'root' })
export class InvoiceStore {
  private http = inject(HttpClient);
  private toast = inject(ToastService);

  private _invoices = signal<Invoice[]>([]);
  private _selectedInvoice = signal<Invoice | null>(null);
  private _isLoading = signal(false);
  private _error = signal<string | null>(null);

  invoices = computed(() => this._invoices());
  selectedInvoice = computed(() => this._selectedInvoice());
  isLoading = computed(() => this._isLoading());
  error = computed(() => this._error());

  loadInvoices(status?: string) {
    this._isLoading.set(true);
    this._error.set(null);

    const url = status ? `${API_CONFIG.INVOICES.LIST}?status=${status}` : API_CONFIG.INVOICES.LIST;

    return this.http.get<Invoice[]>(url).pipe(
      tap((invoices: Invoice[]) => {
        this._invoices.set(invoices);
        this._isLoading.set(false);
      }),
      catchError((error: ErrorResponse) => {
        this._error.set(error.error?.message || 'Failed to load invoices');
        this._isLoading.set(false);
        return throwError(() => error);
      })
    );
  }

  loadInvoice(id: string) {
    this._isLoading.set(true);
    this._error.set(null);

    return this.http.get<Invoice>(API_CONFIG.INVOICES.DETAIL(id)).pipe(
      tap((invoice: Invoice) => {
        this._selectedInvoice.set(invoice);
        this._isLoading.set(false);
      }),
      catchError((error: ErrorResponse) => {
        this._error.set(error.error?.message || 'Failed to load invoice');
        this._isLoading.set(false);
        return throwError(() => error);
      })
    );
  }

  createInvoice(data: CreateInvoicePayload) {
    this._isLoading.set(true);
    this._error.set(null);

    return this.http.post<Invoice>(API_CONFIG.INVOICES.CREATE, data).pipe(
      tap((invoice: Invoice) => {
        this._invoices.update((invoices) => [...invoices, invoice]);
        this._isLoading.set(false);
        this.toast.success('Invoice created successfully');
      }),
      catchError((error: ErrorResponse) => {
        this._error.set(error.error?.message || 'Failed to create invoice');
        this._isLoading.set(false);
        this.toast.error('Failed to create invoice');
        return throwError(() => error);
      })
    );
  }

  updateInvoice(id: string, data: UpdateInvoicePayload) {
    this._isLoading.set(true);
    this._error.set(null);

    return this.http.patch<Invoice>(API_CONFIG.INVOICES.UPDATE(id), data).pipe(
      tap((invoice: Invoice) => {
        this._invoices.update((invoices) =>
          invoices.map((i) => (i._id === id ? invoice : i))
        );
        this._selectedInvoice.set(invoice);
        this._isLoading.set(false);
        this.toast.success('Invoice updated successfully');
      }),
      catchError((error: ErrorResponse) => {
        this._error.set(error.error?.message || 'Failed to update invoice');
        this._isLoading.set(false);
        this.toast.error('Failed to update invoice');
        return throwError(() => error);
      })
    );
  }

  deleteInvoice(id: string) {
    this._isLoading.set(true);
    this._error.set(null);

    return this.http.delete(API_CONFIG.INVOICES.DELETE(id)).pipe(
      tap(() => {
        this._invoices.update((invoices) => invoices.filter((i) => i._id !== id));
        this._isLoading.set(false);
        this.toast.success('Invoice deleted successfully');
      }),
      catchError((error: ErrorResponse) => {
        this._error.set(error.error?.message || 'Failed to delete invoice');
        this._isLoading.set(false);
        this.toast.error('Failed to delete invoice');
        return throwError(() => error);
      })
    );
  }

  sendInvoice(id: string) {
    this._isLoading.set(true);
    this._error.set(null);

    return this.http.post<Invoice>(API_CONFIG.INVOICES.SEND(id), {}).pipe(
      tap((invoice: Invoice) => {
        this._invoices.update((invoices) =>
          invoices.map((i) => (i._id === id ? invoice : i))
        );
        this._isLoading.set(false);
        this.toast.success('Invoice sent successfully');
      }),
      catchError((error: ErrorResponse) => {
        this._error.set(error.error?.message || 'Failed to send invoice');
        this._isLoading.set(false);
        this.toast.error('Failed to send invoice');
        return throwError(() => error);
      })
    );
  }

  aggregateTime(data: {
    projectId: string;
    startDate: string;
    endDate: string;
    rateType: 'hourly' | 'daily';
    rate: number;
  }) {
    return this.http.post<TimeAggregationResult>(API_CONFIG.INVOICES.AGGREGATE_TIME, data).pipe(
      catchError((error: ErrorResponse) => {
        this.toast.error('Failed to aggregate time entries');
        return throwError(() => error);
      })
    );
  }
}
