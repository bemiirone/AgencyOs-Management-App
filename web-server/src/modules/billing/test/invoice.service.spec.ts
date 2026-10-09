import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { InvoiceService } from '../invoice.service';

vi.mock('../schemas/invoice.schema', () => ({
  Invoice: 'Invoice',
  InvoiceStatus: {
    DRAFT: 'draft',
    SENT: 'sent',
    PAID: 'paid',
    OVERDUE: 'overdue',
    CANCELLED: 'cancelled',
  },
  BillingType: {
    BUDGET: 'budget',
    HOURLY: 'hourly',
    DAILY: 'daily',
    MANUAL: 'manual',
  },
}));

vi.mock('../../time/schemas/time-entry.schema', () => ({
  TimeEntry: 'TimeEntry',
}));

vi.mock('../../project/schemas/project.schema', () => ({
  Project: 'Project',
}));

vi.mock('@nestjs/mongoose', () => ({
  InjectModel: () => () => {},
  getModelToken: (name: string) => `${name}Model`,
  Prop: () => () => {},
  Schema: () => () => {},
  SchemaFactory: { createForClass: () => ({ index: () => ({}) }) },
}));

vi.mock('@nestjs/common', async () => {
  const actual = await vi.importActual('@nestjs/common');
  return {
    ...actual,
    Injectable: () => () => {},
  };
});

describe('InvoiceService', () => {
  let service: InvoiceService;

  const mockInvoiceId = 'invoice-123';
  const mockTenantId = 'tenant-456';

  const mockInvoice: any = {
    _id: mockInvoiceId,
    invoiceNumber: 'INV-2026-00001',
    status: 'draft',
    projectId: 'project-789',
    clientName: 'Test Client',
    clientEmail: 'client@test.com',
    total: 1500.00,
    subtotal: 1400.00,
    tax: 100.00,
    billingType: 'budget',
    sendOverdueReminders: false,
    lineItems: [],
    expenses: [],
    timeEntryIds: [],
    taskIds: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    save: vi.fn().mockResolvedValue(undefined),
  };

  const mockProject = {
    _id: 'project-789',
    name: 'Test Project',
    clientName: 'Test Client',
    clientEmail: 'client@test.com',
  };

  const mockInvoiceModel = {
    findById: vi.fn(),
    findOne: vi.fn(),
    findOneAndUpdate: vi.fn(),
    countDocuments: vi.fn().mockResolvedValue(0),
    create: vi.fn().mockImplementation((data) => Promise.resolve({ ...mockInvoice, ...data, _id: mockInvoiceId })),
  };

  const createFindOneChain = (result: any) => ({
    populate: vi.fn().mockReturnValue({
      populate: vi.fn().mockReturnValue({
        exec: vi.fn().mockResolvedValue({ ...result, save: vi.fn().mockResolvedValue(undefined) }),
      }),
    }),
  });

  const mockTimeEntryModel = {
    find: vi.fn(),
  };

  const mockProjectModel = {
    findById: vi.fn(),
  };

  const mockConfigService = {
    get: vi.fn((key: string) => {
      if (key === 'stripe.secretKey') return 'sk_test_placeholder';
      return '';
    }),
  };

  const mockEmailService = {
    sendInvoiceEmail: vi.fn().mockResolvedValue(undefined),
    sendPaymentConfirmationEmail: vi.fn().mockResolvedValue(undefined),
    sendOverdueReminderEmail: vi.fn().mockResolvedValue(undefined),
  };

  beforeEach(() => {
    vi.resetAllMocks();

    mockInvoiceModel.findById.mockReturnValue(createFindOneChain(mockInvoice));
    mockInvoiceModel.findOne.mockReturnValue(createFindOneChain(mockInvoice));

    mockProjectModel.findById.mockReturnValue({
      exec: vi.fn().mockResolvedValue(mockProject),
    });

    mockEmailService.sendInvoiceEmail.mockResolvedValue(undefined);
    mockEmailService.sendPaymentConfirmationEmail.mockResolvedValue(undefined);
    mockEmailService.sendOverdueReminderEmail.mockResolvedValue(undefined);

    service = new InvoiceService(
      mockInvoiceModel as any,
      mockTimeEntryModel as any,
      mockProjectModel as any,
      mockConfigService as any,
      mockEmailService as any,
    );
  });

  describe('sendInvoice', () => {
    it('should throw BadRequestException if invoice is not in DRAFT status', async () => {
      const sentInvoice = { ...mockInvoice, status: 'sent' };
      mockInvoiceModel.findById.mockReturnValue(createFindOneChain(sentInvoice));
      mockInvoiceModel.findOne.mockReturnValue(createFindOneChain(sentInvoice));

      await expect(service.sendInvoice(mockInvoiceId, mockTenantId)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw NotFoundException if project not found', async () => {
      mockProjectModel.findById.mockReturnValue({
        exec: vi.fn().mockResolvedValue(null),
      });

      await expect(service.sendInvoice(mockInvoiceId, mockTenantId)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException if email sending fails', async () => {
      mockEmailService.sendInvoiceEmail.mockRejectedValue(new Error('SendGrid API error'));

      await expect(service.sendInvoice(mockInvoiceId, mockTenantId)).rejects.toThrow(
        BadRequestException,
      );

      await expect(service.sendInvoice(mockInvoiceId, mockTenantId)).rejects.toThrow(
        'Failed to send invoice email',
      );
    });

    it('should send email and update status to SENT when successful', async () => {
      mockEmailService.sendInvoiceEmail.mockResolvedValue(undefined);
      const result = await service.sendInvoice(mockInvoiceId, mockTenantId);

      expect(mockEmailService.sendInvoiceEmail).toHaveBeenCalledWith(expect.anything(), mockProject);
      expect(result.status).toBe('sent');
    });
  });

  describe('resendOverdueReminder', () => {
    it('should throw BadRequestException if invoice is not OVERDUE', async () => {
      const draftInvoice = { ...mockInvoice, status: 'draft' };
      mockInvoiceModel.findById.mockReturnValue(createFindOneChain(draftInvoice));
      mockInvoiceModel.findOne.mockReturnValue(createFindOneChain(draftInvoice));

      await expect(service.resendOverdueReminder(mockInvoiceId, mockTenantId)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException if overdue reminders are not enabled', async () => {
      const overdueInvoice = { ...mockInvoice, status: 'overdue', sendOverdueReminders: false };
      mockInvoiceModel.findById.mockReturnValue(createFindOneChain(overdueInvoice));
      mockInvoiceModel.findOne.mockReturnValue(createFindOneChain(overdueInvoice));

      await expect(service.resendOverdueReminder(mockInvoiceId, mockTenantId)).rejects.toThrow(
        BadRequestException,
      );

      await expect(service.resendOverdueReminder(mockInvoiceId, mockTenantId)).rejects.toThrow(
        'Overdue reminders are not enabled',
      );
    });

    it('should send overdue reminder email when valid', async () => {
      const overdueInvoice = { ...mockInvoice, status: 'overdue', sendOverdueReminders: true };
      mockInvoiceModel.findById.mockReturnValue(createFindOneChain(overdueInvoice));
      mockInvoiceModel.findOne.mockReturnValue(createFindOneChain(overdueInvoice));

      const result = await service.resendOverdueReminder(mockInvoiceId, mockTenantId);

      expect(mockEmailService.sendOverdueReminderEmail).toHaveBeenCalledWith(expect.objectContaining({
        status: 'overdue',
        sendOverdueReminders: true,
      }));
      expect(result).toEqual({
        success: true,
        message: 'Overdue reminder sent successfully',
      });
    });
  });

  describe('processPayment', () => {
    it('should update invoice status to PAID in mock mode', async () => {
      let currentStatus = 'sent';
      let paidAtValue: Date | undefined;
      let stripeId: string | undefined;
      
      const sentInvoice = { 
        ...mockInvoice, 
        status: 'sent',
        save: vi.fn().mockImplementation(function(this: any) {
          currentStatus = this.status;
          paidAtValue = this.paidAt;
          stripeId = this.stripePaymentIntentId;
          return Promise.resolve(undefined);
        }),
      };
      
      const chainWithSave = {
        populate: vi.fn().mockReturnValue({
          populate: vi.fn().mockReturnValue({
            exec: vi.fn().mockResolvedValue(sentInvoice),
          }),
        }),
      };
      
      mockInvoiceModel.findById.mockReturnValue(chainWithSave);
      mockInvoiceModel.findOne.mockReturnValue(chainWithSave);

      await service.processPayment(mockInvoiceId, mockTenantId, 'pm_test_method');

      expect(currentStatus).toBe('paid');
      expect(paidAtValue).toBeDefined();
      expect(stripeId).toContain('mock_pi_');
    });

    it('should send payment confirmation email (non-blocking)', async () => {
      let currentStatus = 'sent';
      const sentInvoice = { 
        ...mockInvoice, 
        status: 'sent',
        save: vi.fn().mockImplementation(function(this: any) {
          currentStatus = this.status;
          return Promise.resolve(undefined);
        }),
      };
      
      const chainWithSave = {
        populate: vi.fn().mockReturnValue({
          populate: vi.fn().mockReturnValue({
            exec: vi.fn().mockResolvedValue(sentInvoice),
          }),
        }),
      };
      
      mockInvoiceModel.findById.mockReturnValue(chainWithSave);
      mockInvoiceModel.findOne.mockReturnValue(chainWithSave);

      await service.processPayment(mockInvoiceId, mockTenantId, 'pm_test_method');

      expect(mockEmailService.sendPaymentConfirmationEmail).toHaveBeenCalled();
    });

    it('should not fail payment if confirmation email fails', async () => {
      mockEmailService.sendPaymentConfirmationEmail.mockRejectedValue(new Error('Email failed'));
      let currentStatus = 'sent';
      const sentInvoice = { 
        ...mockInvoice, 
        status: 'sent',
        save: vi.fn().mockImplementation(function(this: any) {
          currentStatus = this.status;
          return Promise.resolve(undefined);
        }),
      };
      
      const chainWithSave = {
        populate: vi.fn().mockReturnValue({
          populate: vi.fn().mockReturnValue({
            exec: vi.fn().mockResolvedValue(sentInvoice),
          }),
        }),
      };
      
      mockInvoiceModel.findById.mockReturnValue(chainWithSave);
      mockInvoiceModel.findOne.mockReturnValue(chainWithSave);

      const result = await service.processPayment(mockInvoiceId, mockTenantId, 'pm_test_method');

      expect(currentStatus).toBe('paid');
    });
  });
});
