import { TestBed } from '@angular/core/testing';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { InvoiceStore, CreateInvoicePayload, UpdateInvoicePayload } from './invoice.store';
import { ToastService } from '../core/services/toast.service';
import { API_CONFIG } from '../core/config/api.config';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('InvoiceStore', () => {
  let store: InvoiceStore;
  let httpMock: HttpTestingController;
  let toastMock: { success: any; error: any; info: any; warning: any };

  const mockInvoice = {
    _id: 'invoice-1',
    invoiceNumber: 'INV-001',
    projectId: 'project-1',
    projectName: 'Test Project',
    clientId: 'client-1',
    clientName: 'Test Client',
    clientEmail: 'client@example.com',
    status: 'draft' as const,
    billingType: 'hourly' as const,
    lineItems: [{ description: 'Development', quantity: 10, rate: 100, amount: 1000 }],
    expenses: [],
    taskId: 'task-1',
    taskName: 'Test Task',
    subtotal: 1000,
    amount: 1000,
    tax: 0,
    total: 1000,
    dueDate: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    toastMock = {
      success: vi.fn(),
      error: vi.fn(),
      info: vi.fn(),
      warning: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        InvoiceStore,
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting(),
        { provide: ToastService, useValue: toastMock },
      ],
    });

    store = TestBed.inject(InvoiceStore);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    vi.clearAllMocks();
  });

  describe('loadInvoices', () => {
    it('should load all invoices', () => {
      const mockInvoices = [mockInvoice];

      store.loadInvoices().subscribe((invoices) => {
        expect(invoices).toEqual(mockInvoices);
        expect(store.invoices()).toEqual(mockInvoices);
        expect(store.isLoading()).toBe(false);
      });

      const req = httpMock.expectOne(API_CONFIG.INVOICES.LIST);
      expect(req.request.method).toBe('GET');
      req.flush(mockInvoices);
    });

    it('should load invoices with status filter', () => {
      const mockInvoices = [mockInvoice];

      store.loadInvoices('paid').subscribe((invoices) => {
        expect(invoices).toEqual(mockInvoices);
      });

      const req = httpMock.expectOne(`${API_CONFIG.INVOICES.LIST}?status=paid`);
      expect(req.request.method).toBe('GET');
      req.flush(mockInvoices);
    });

    it('should set error on failure', () => {
      store.loadInvoices().subscribe({
        next: () => {},
        error: () => {
          expect(store.isLoading()).toBe(false);
        },
      });

      const req = httpMock.expectOne(API_CONFIG.INVOICES.LIST);
      req.flush({ message: 'Error' }, { status: 500, statusText: 'Error' });
    });
  });

  describe('loadInvoice', () => {
    it('should load a single invoice by ID', () => {
      store.loadInvoice('invoice-1').subscribe((invoice) => {
        expect(invoice).toEqual(mockInvoice);
        expect(store.selectedInvoice()).toEqual(mockInvoice);
        expect(store.isLoading()).toBe(false);
      });

      const req = httpMock.expectOne(API_CONFIG.INVOICES.DETAIL('invoice-1'));
      expect(req.request.method).toBe('GET');
      req.flush(mockInvoice);
    });

    it('should set error on failure', () => {
      store.loadInvoice('invoice-1').subscribe({
        next: () => {},
        error: () => {
          expect(store.isLoading()).toBe(false);
        },
      });

      const req = httpMock.expectOne(API_CONFIG.INVOICES.DETAIL('invoice-1'));
      req.flush({ message: 'Not found' }, { status: 404, statusText: 'Not Found' });
    });
  });

  describe('createInvoice', () => {
    it('should create an invoice and show success toast', () => {
      const createData: CreateInvoicePayload = {
        projectId: 'project-1',
        clientName: 'Test Client',
        clientEmail: 'client@example.com',
        subtotal: 1000,
        amount: 1000,
      };

      store.createInvoice(createData).subscribe((invoice) => {
        expect(invoice.invoiceNumber).toBe('INV-001');
        expect(store.invoices()).toContain(invoice);
        expect(toastMock.success).toHaveBeenCalledWith('Invoice created successfully');
      });

      const req = httpMock.expectOne(API_CONFIG.INVOICES.CREATE);
      expect(req.request.method).toBe('POST');
      req.flush(mockInvoice);
    });

    it('should show error toast on failure', () => {
      store.createInvoice({ projectId: 'project-1', clientName: 'Test', clientEmail: 'test@test.com', subtotal: 100, amount: 100 }).subscribe({
        next: () => {},
        error: () => {
          expect(toastMock.error).toHaveBeenCalledWith('Failed to create invoice');
        },
      });

      const req = httpMock.expectOne(API_CONFIG.INVOICES.CREATE);
      req.flush({ message: 'Error' }, { status: 400, statusText: 'Bad Request' });
    });
  });

  describe('updateInvoice', () => {
    it('should update an invoice and show success toast', () => {
      const updateData: UpdateInvoicePayload = { status: 'sent' };
      const updatedInvoice = { ...mockInvoice, status: 'sent' as const };

      store.updateInvoice('invoice-1', updateData).subscribe((invoice) => {
        expect(invoice.status).toBe('sent');
        expect(store.selectedInvoice()).toEqual(updatedInvoice);
        expect(toastMock.success).toHaveBeenCalledWith('Invoice updated successfully');
      });

      const req = httpMock.expectOne(API_CONFIG.INVOICES.UPDATE('invoice-1'));
      expect(req.request.method).toBe('PATCH');
      req.flush(updatedInvoice);
    });

    it('should show error toast on failure', () => {
      store.updateInvoice('invoice-1', { status: 'sent' }).subscribe({
        next: () => {},
        error: () => {
          expect(toastMock.error).toHaveBeenCalledWith('Failed to update invoice');
        },
      });

      const req = httpMock.expectOne(API_CONFIG.INVOICES.UPDATE('invoice-1'));
      req.flush({ message: 'Error' }, { status: 400, statusText: 'Bad Request' });
    });
  });

  describe('deleteInvoice', () => {
    it('should delete an invoice and show success toast', () => {
      store.deleteInvoice('invoice-1').subscribe(() => {
        expect(store.invoices().filter((i) => i._id === 'invoice-1')).toHaveLength(0);
        expect(toastMock.success).toHaveBeenCalledWith('Invoice deleted successfully');
      });

      const req = httpMock.expectOne(API_CONFIG.INVOICES.DELETE('invoice-1'));
      expect(req.request.method).toBe('DELETE');
      req.flush({ success: true });
    });

    it('should show error toast on failure', () => {
      store.deleteInvoice('invoice-1').subscribe({
        next: () => {},
        error: () => {
          expect(toastMock.error).toHaveBeenCalledWith('Failed to delete invoice');
        },
      });

      const req = httpMock.expectOne(API_CONFIG.INVOICES.DELETE('invoice-1'));
      req.flush({ message: 'Error' }, { status: 400, statusText: 'Bad Request' });
    });
  });

  describe('sendInvoice', () => {
    it('should send an invoice and show success toast', () => {
      const sentInvoice = { ...mockInvoice, status: 'sent' as const };

      store.sendInvoice('invoice-1').subscribe((invoice) => {
        expect(invoice.status).toBe('sent');
        expect(toastMock.success).toHaveBeenCalledWith('Invoice sent successfully');
      });

      const req = httpMock.expectOne(API_CONFIG.INVOICES.SEND('invoice-1'));
      expect(req.request.method).toBe('POST');
      req.flush(sentInvoice);
    });

    it('should show error toast on failure', () => {
      store.sendInvoice('invoice-1').subscribe({
        next: () => {},
        error: () => {
          expect(toastMock.error).toHaveBeenCalledWith('Failed to send invoice');
        },
      });

      const req = httpMock.expectOne(API_CONFIG.INVOICES.SEND('invoice-1'));
      req.flush({ message: 'Error' }, { status: 400, statusText: 'Bad Request' });
    });
  });

  describe('aggregateTime', () => {
    it('should aggregate time entries', () => {
      const aggregationData = {
        projectId: 'project-1',
        startDate: '2024-01-01',
        endDate: '2024-01-31',
        rateType: 'hourly' as const,
        rate: 100,
      };

      const result = {
        totalSeconds: 36000,
        totalHours: 10,
        totalDays: 1.25,
        entryCount: 5,
        amount: 1000,
        timeEntryIds: ['entry-1', 'entry-2'],
      };

      store.aggregateTime(aggregationData).subscribe((aggResult) => {
        expect(aggResult.totalHours).toBe(10);
        expect(aggResult.amount).toBe(1000);
      });

      const req = httpMock.expectOne(API_CONFIG.INVOICES.AGGREGATE_TIME);
      expect(req.request.method).toBe('POST');
      req.flush(result);
    });

    it('should show error toast on failure', () => {
      store.aggregateTime({
        projectId: 'project-1',
        startDate: '2024-01-01',
        endDate: '2024-01-31',
        rateType: 'hourly',
        rate: 100,
      }).subscribe({
        next: () => {},
        error: () => {
          expect(toastMock.error).toHaveBeenCalledWith('Failed to aggregate time entries');
        },
      });

      const req = httpMock.expectOne(API_CONFIG.INVOICES.AGGREGATE_TIME);
      req.flush({ message: 'Error' }, { status: 400, statusText: 'Bad Request' });
    });
  });
});
