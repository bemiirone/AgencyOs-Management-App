import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { InvoicesComponent } from './invoices.component';
import { InvoiceStore } from '../../stores/invoice.store';
import { ProjectStore } from '../../stores/project.store';
import { ToastService } from '../../core/services/toast.service';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Invoice } from '../../shared/models/invoice.model';
import { ContentStore } from '../../stores/content.store';

const mockInvoiceStore = {
  loadInvoices: vi.fn(() => ({ subscribe: vi.fn() })),
  deleteInvoice: vi.fn(() => ({ subscribe: vi.fn() })),
  sendInvoice: vi.fn(() => ({ subscribe: vi.fn() })),
};

const mockProjectStore = {
  loadAllProjects: vi.fn(() => ({ subscribe: vi.fn() })),
};

const mockToastService = {
  success: vi.fn(),
  error: vi.fn(),
  info: vi.fn(),
  warning: vi.fn(),
};

const mockContentStore = {
  content: vi.fn((key: string) => ({
    'invoice.status.draft': 'Draft',
    'invoice.status.sent': 'Sent',
    'invoice.status.paid': 'Paid',
    'invoice.billingType.budget': 'Budget',
    'invoice.billingType.hourly': 'Hourly',
    'invoice.billingType.daily': 'Daily',
    'invoice.billingType.manual': 'Manual',
  })[key] ?? key),
};

function createMockInvoice(overrides: Partial<Invoice> = {}): Invoice {
  return {
    _id: '1',
    invoiceNumber: 'INV-001',
    projectId: 'project-1',
    clientId: 'client-1',
    clientName: 'Test Client',
    clientEmail: 'client@example.com',
    status: 'draft',
    billingType: 'budget',
    lineItems: [],
    expenses: [],
    subtotal: 100,
    amount: 100,
    tax: 0,
    total: 100,
    dueDate: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

describe('InvoicesComponent', () => {
  let component: InvoicesComponent;
  let fixture: ComponentFixture<InvoicesComponent>;

  beforeEach(async () => {
    vi.clearAllMocks();

    await TestBed.configureTestingModule({
      imports: [InvoicesComponent],
      providers: [
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: InvoiceStore, useValue: mockInvoiceStore },
        { provide: ProjectStore, useValue: mockProjectStore },
        { provide: ToastService, useValue: mockToastService },
        { provide: ContentStore, useValue: mockContentStore },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(InvoicesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with empty invoices', () => {
    expect(component.invoices()).toEqual([]);
    // loading is true initially because loadInvoices() sets it to true before the async call completes
    expect(component.loading()).toBe(true);
  });

  it('should load invoices on init', () => {
    expect(mockInvoiceStore.loadInvoices).toHaveBeenCalled();
  });

  it('should filter invoices by search query', () => {
    component.invoices.set([
      createMockInvoice({ _id: '1', clientName: 'Acme Corp', projectName: 'Project A' }),
      createMockInvoice({ _id: '2', clientName: 'Beta Inc', projectName: 'Project B', status: 'paid' }),
    ]);

    component.searchQuery.set('Acme');
    expect(component.filteredInvoices).toHaveLength(1);
    expect(component.filteredInvoices[0].clientName).toBe('Acme Corp');
  });

  it('should return all invoices when search is empty', () => {
    const invoices = [createMockInvoice()];
    component.invoices.set(invoices);
    component.searchQuery.set('');

    expect(component.filteredInvoices).toEqual(invoices);
  });

  it('should format currency correctly', () => {
    expect(component.formatCurrency(1234.56)).toBe('£1,234.56');
    expect(component.formatCurrency(0)).toBe('£0.00');
  });

  it('should get correct status class', () => {
    expect(component.getStatusClass('draft')).toBe('badge-ghost');
    expect(component.getStatusClass('sent')).toBe('badge-info');
    expect(component.getStatusClass('paid')).toBe('badge-success');
    expect(component.getStatusClass('overdue')).toBe('badge-error');
    expect(component.getStatusClass('cancelled')).toBe('badge-neutral');
  });

  it('should get correct status label', () => {
    expect(component.getStatusLabel('draft')).toBe('Draft');
    expect(component.getStatusLabel('sent')).toBe('Sent');
    expect(component.getStatusLabel('paid')).toBe('Paid');
  });

  it('should get correct billing type label', () => {
    expect(component.getBillingTypeLabel('budget')).toBe('Budget');
    expect(component.getBillingTypeLabel('hourly')).toBe('Hourly');
    expect(component.getBillingTypeLabel('daily')).toBe('Daily');
    expect(component.getBillingTypeLabel('manual')).toBe('Manual');
  });
});
