import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ConfigService } from '@nestjs/config';
import { EmailService } from '../email.service';

vi.mock('@sendgrid/mail', () => ({
  setApiKey: vi.fn(),
  send: vi.fn().mockResolvedValue([{}]),
}));

describe('EmailService', () => {
  let service: EmailService;

  const mockConfigService = {
    get: vi.fn((key: string) => {
      const config: Record<string, string> = {
        'sendgrid.apiKey': 'SG.placeholder_test_key',
        'sendgrid.fromEmail': 'test@agencyos.com',
        'sendgrid.fromName': 'AgencyOS Test',
        'sendgrid.clientPortalUrl': 'http://localhost:4200',
      };
      return config[key] || '';
    }),
  };

  const mockInvoice = {
    _id: 'invoice-123',
    invoiceNumber: 'INV-2026-00001',
    clientName: 'Test Client',
    clientEmail: 'client@test.com',
    total: 1500.00,
    subtotal: 1400.00,
    tax: 100.00,
    status: 'sent',
    dueDate: new Date('2026-10-15'),
    createdAt: new Date('2026-10-01'),
    notes: 'Thank you for your business',
    lineItems: [
      { description: 'Design Work', quantity: 10, rate: 100, amount: 1000 },
      { description: 'Development', quantity: 4, rate: 100, amount: 400 },
    ],
    expenses: [],
  };

  const mockProject = {
    _id: 'project-456',
    name: 'Test Project',
    clientName: 'Test Client',
    clientEmail: 'client@test.com',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    service = new EmailService(mockConfigService as any);
  });

  describe('constructor', () => {
    it('should be in mock mode with placeholder API key', () => {
      expect(service).toBeDefined();
      const isMockMode = (service as any).isMockMode;
      expect(isMockMode).toBe(true);
    });

    it('should be in real mode with valid API key', () => {
      const realConfig = {
        get: vi.fn((key: string) => {
          if (key === 'sendgrid.apiKey') return 'SG.real_api_key_123';
          return '';
        }),
      };
      const realService = new EmailService(realConfig as any);
      const isMockMode = (realService as any).isMockMode;
      expect(isMockMode).toBe(false);
    });
  });

  describe('sendInvoiceEmail', () => {
    it('should call sendEmail with correct parameters in mock mode', async () => {
      const sendEmailSpy = vi.spyOn(service as any, 'sendEmail').mockResolvedValue(undefined);

      await service.sendInvoiceEmail(mockInvoice as any, mockProject as any);

      expect(sendEmailSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'client@test.com',
          subject: expect.stringContaining('INV-2026-00001'),
          html: expect.any(String),
          attachments: expect.arrayContaining([
            expect.objectContaining({
              filename: 'INV-2026-00001.pdf',
              type: 'application/pdf',
              disposition: 'attachment',
            }),
          ]),
        }),
      );
    });

    it('should include pay link in email', async () => {
      const sendEmailSpy = vi.spyOn(service as any, 'sendEmail').mockResolvedValue(undefined);

      await service.sendInvoiceEmail(mockInvoice as any, mockProject as any);

      const callArgs = sendEmailSpy.mock.calls[0][0];
      expect(callArgs.html).toContain('http://localhost:4200/client-portal/invoices');
      expect(callArgs.html).toContain('/pay');
    });
  });

  describe('sendPaymentConfirmationEmail', () => {
    it('should call sendEmail with payment confirmation details', async () => {
      const paidInvoice = {
        ...mockInvoice,
        status: 'paid',
        paidAt: new Date('2026-10-10'),
      };

      const sendEmailSpy = vi.spyOn(service as any, 'sendEmail').mockResolvedValue(undefined);

      await service.sendPaymentConfirmationEmail(paidInvoice as any);

      expect(sendEmailSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'client@test.com',
          subject: expect.stringContaining('Payment Received'),
          html: expect.any(String),
        }),
      );
    });
  });

  describe('sendOverdueReminderEmail', () => {
    it('should call sendEmail with overdue reminder details', async () => {
      const overdueInvoice = {
        ...mockInvoice,
        status: 'overdue',
        dueDate: new Date('2026-09-15'),
      };

      const sendEmailSpy = vi.spyOn(service as any, 'sendEmail').mockResolvedValue(undefined);

      await service.sendOverdueReminderEmail(overdueInvoice as any);

      expect(sendEmailSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'client@test.com',
          subject: expect.stringContaining('Overdue'),
          html: expect.any(String),
        }),
      );
    });

    it('should include days overdue in email', async () => {
      const today = new Date();
      const tenDaysAgo = new Date(today.getTime() - 10 * 24 * 60 * 60 * 1000);
      const overdueInvoice = {
        ...mockInvoice,
        status: 'overdue',
        dueDate: tenDaysAgo,
      };

      const sendEmailSpy = vi.spyOn(service as any, 'sendEmail').mockResolvedValue(undefined);

      await service.sendOverdueReminderEmail(overdueInvoice as any);

      const callArgs = sendEmailSpy.mock.calls[0][0];
      expect(callArgs.html).toContain('10 day');
    });
  });

  describe('generateInvoicePDF', () => {
    it('should generate a valid PDF buffer', async () => {
      const pdfBuffer = await (service as any).generateInvoicePDF(mockInvoice, mockProject);

      expect(Buffer.isBuffer(pdfBuffer)).toBe(true);
      expect(pdfBuffer.length).toBeGreaterThan(0);

      expect(pdfBuffer.slice(0, 5).toString()).toBe('%PDF-');
    });

    it('should generate PDF with reasonable size', async () => {
      const pdfBuffer = await (service as any).generateInvoicePDF(mockInvoice, mockProject);

      expect(pdfBuffer.length).toBeGreaterThan(1000);
      expect(pdfBuffer.length).toBeLessThan(100000);
    });
  });
});
