import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter, ActivatedRoute } from '@angular/router';
import { InvoiceDetailComponent } from './invoice-detail.component';
import { InvoiceStore } from '../../../stores/invoice.store';
import { ToastService } from '../../../core/services/toast.service';
import { of } from 'rxjs';
import { describe, it, expect, beforeEach, vi } from 'vitest';

const mockInvoiceStore = {
  loadInvoice: vi.fn(() => of({})),
  sendInvoice: vi.fn(() => of({})),
};

const mockToastService = {
  success: vi.fn(),
  error: vi.fn(),
  info: vi.fn(),
  warning: vi.fn(),
};

const mockActivatedRoute = {
  snapshot: { paramMap: { get: vi.fn(() => 'invoice-1') } },
};

describe('InvoiceDetailComponent', () => {
  let component: InvoiceDetailComponent;
  let fixture: ComponentFixture<InvoiceDetailComponent>;

  beforeEach(async () => {
    vi.clearAllMocks();

    await TestBed.configureTestingModule({
      imports: [InvoiceDetailComponent],
      providers: [
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: InvoiceStore, useValue: mockInvoiceStore },
        { provide: ToastService, useValue: mockToastService },
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(InvoiceDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load invoice on init', () => {
    expect(mockInvoiceStore.loadInvoice).toHaveBeenCalledWith('invoice-1');
  });

  it('should format currency correctly', () => {
    component.invoice.set({ total: 1234.56 } as any);
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
    expect(component.getBillingTypeLabel('budget')).toBe('Project Budget');
    expect(component.getBillingTypeLabel('hourly')).toBe('Hourly Rate');
    expect(component.getBillingTypeLabel('daily')).toBe('Daily Rate');
    expect(component.getBillingTypeLabel('manual')).toBe('Manual Line Items');
  });

  it('should format date correctly', () => {
    const date = new Date('2024-01-15');
    const formatted = component.formatDate(date);
    expect(formatted).toBeTruthy();
    expect(typeof formatted).toBe('string');
  });

  it('should return N/A for undefined date', () => {
    expect(component.formatDate(undefined)).toBe('N/A');
  });

  it('should send invoice when confirmed', () => {
    const mockInvoice = { _id: 'invoice-1', status: 'draft' };
    component.invoice.set(mockInvoice as any);

    vi.spyOn(window, 'confirm').mockReturnValue(true);
    component.sendInvoice();

    expect(mockInvoiceStore.sendInvoice).toHaveBeenCalledWith('invoice-1');
  });
});
