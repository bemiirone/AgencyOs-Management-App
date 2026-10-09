import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DueDateCheckerService } from '../due-date-checker.service';

vi.mock('../../billing/schemas/invoice.schema', () => ({
  Invoice: 'Invoice',
  InvoiceStatus: {
    SENT: 'sent',
    OVERDUE: 'overdue',
  },
}));

vi.mock('../../project/schemas/project.schema', () => ({
  Project: 'Project',
  ProjectStatus: {
    ACTIVE: 'active',
  },
}));

vi.mock('../../project/schemas/task.schema', () => ({
  Task: 'Task',
  TaskStatus: {
    DONE: 'done',
  },
}));

vi.mock('../../tenant/schemas/tenant-member.schema', () => ({
  TenantMember: 'TenantMember',
  UserRole: {
    ADMIN: 'admin',
  },
}));

vi.mock('../../notification/schemas/notification.schema', () => ({
  Notification: 'Notification',
  NotificationType: {
    EMAIL: 'email',
    WEBSOCKET: 'websocket',
    BOTH: 'both',
  },
  NotificationStatus: {
    PENDING: 'pending',
    SENT: 'sent',
    FAILED: 'failed',
  },
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

describe('DueDateCheckerService', () => {
  let service: DueDateCheckerService;

  const mockTenantId = 'tenant-123';

  const baseSettings = {
    enabled: true,
    invoiceDueSoon: { enabled: true, titleTemplate: 'Invoice {{number}} due soon', messageTemplate: 'Invoice is due soon' },
    invoiceOverdue: { enabled: true, titleTemplate: 'Invoice {{number}} overdue', messageTemplate: 'Invoice is overdue' },
  };

  const mockInvoiceWithReminders = {
    _id: 'invoice-001',
    invoiceNumber: 'INV-2026-00001',
    status: 'sent',
    clientName: 'Test Client',
    clientEmail: 'client@test.com',
    total: 1500.00,
    dueDate: new Date('2026-10-01'),
    sendOverdueReminders: true,
  };

  const mockInvoiceWithoutReminders = {
    _id: 'invoice-002',
    invoiceNumber: 'INV-2026-00002',
    status: 'sent',
    clientName: 'Another Client',
    clientEmail: 'another@test.com',
    total: 2000.00,
    dueDate: new Date('2026-10-01'),
    sendOverdueReminders: false,
  };

  const mockInvoiceModel = {
    find: vi.fn(),
    findByIdAndUpdate: vi.fn(),
  };

  const mockEmailService = {
    sendOverdueReminderEmail: vi.fn().mockResolvedValue(undefined),
  };

  const mockNotificationService = {
    createNotification: vi.fn().mockResolvedValue(undefined),
  };

  const mockTenantService = {
    findAllActive: vi.fn().mockResolvedValue([{ _id: mockTenantId }]),
  };

  const mockSettingsService = {
    getSettings: vi.fn().mockResolvedValue(baseSettings),
    updateLastRun: vi.fn().mockResolvedValue(undefined),
  };

  const mockProjectModel = {
    find: vi.fn().mockReturnValue({
      exec: vi.fn().mockResolvedValue([]),
    }),
  };

  const mockTaskModel = {
    find: vi.fn().mockReturnValue({
      exec: vi.fn().mockResolvedValue([]),
    }),
  };

  const mockTenantMemberModel = {
    find: vi.fn().mockReturnValue({
      exec: vi.fn().mockResolvedValue([]),
    }),
  };

  beforeEach(() => {
    vi.clearAllMocks();

    mockInvoiceModel.find.mockReturnValue({
      exec: vi.fn().mockResolvedValue([]),
    });

    mockInvoiceModel.findByIdAndUpdate.mockReturnValue({
      exec: vi.fn().mockResolvedValue({}),
    });

    mockProjectModel.find.mockReturnValue({
      exec: vi.fn().mockResolvedValue([]),
    });

    mockTaskModel.find.mockReturnValue({
      exec: vi.fn().mockResolvedValue([]),
    });

    service = new DueDateCheckerService(
      mockProjectModel as any,
      mockTaskModel as any,
      mockInvoiceModel as any,
      mockTenantMemberModel as any,
      mockNotificationService as any,
      mockTenantService as any,
      mockSettingsService as any,
      mockEmailService as any,
    );
  });

  describe('checkInvoices', () => {
    it('should send overdue email when sendOverdueReminders is true', async () => {
      const today = new Date();
      const tenDaysAgo = new Date(today.getTime() - 10 * 24 * 60 * 60 * 1000);
      const overdueInvoice = {
        ...mockInvoiceWithReminders,
        status: 'sent',
        dueDate: tenDaysAgo,
      };

      mockInvoiceModel.find.mockReturnValue({
        exec: vi.fn().mockResolvedValue([overdueInvoice]),
      });

      const checkTenant = (service as any).checkTenant.bind(service);
      await checkTenant(mockTenantId, baseSettings);

      expect(mockEmailService.sendOverdueReminderEmail).toHaveBeenCalledWith(overdueInvoice);
    });

    it('should NOT send overdue email when sendOverdueReminders is false', async () => {
      const today = new Date();
      const tenDaysAgo = new Date(today.getTime() - 10 * 24 * 60 * 60 * 1000);
      const overdueInvoice = {
        ...mockInvoiceWithoutReminders,
        status: 'sent',
        dueDate: tenDaysAgo,
      };

      mockInvoiceModel.find.mockReturnValue({
        exec: vi.fn().mockResolvedValue([overdueInvoice]),
      });

      const checkTenant = (service as any).checkTenant.bind(service);
      await checkTenant(mockTenantId, baseSettings);

      expect(mockEmailService.sendOverdueReminderEmail).not.toHaveBeenCalled();
    });

    it('should still create in-app notifications even when sendOverdueReminders is false', async () => {
      const today = new Date();
      const tenDaysAgo = new Date(today.getTime() - 10 * 24 * 60 * 60 * 1000);
      const overdueInvoice = {
        ...mockInvoiceWithoutReminders,
        status: 'sent',
        dueDate: tenDaysAgo,
      };

      const mockAdminMembers = [
        { _id: 'admin-1', userId: 'user-1', role: 'admin', isActive: true },
      ];

      mockInvoiceModel.find.mockReturnValue({
        exec: vi.fn().mockResolvedValue([overdueInvoice]),
      });

      mockTenantMemberModel.find.mockReturnValue({
        exec: vi.fn().mockResolvedValue(mockAdminMembers),
      });

      const checkTenant = (service as any).checkTenant.bind(service);
      await checkTenant(mockTenantId, baseSettings);

      expect(mockNotificationService.createNotification).toHaveBeenCalled();
      expect(mockEmailService.sendOverdueReminderEmail).not.toHaveBeenCalled();
    });

    it('should handle email failure gracefully without breaking the flow', async () => {
      const today = new Date();
      const tenDaysAgo = new Date(today.getTime() - 10 * 24 * 60 * 60 * 1000);
      const overdueInvoice = {
        ...mockInvoiceWithReminders,
        status: 'sent',
        dueDate: tenDaysAgo,
      };

      mockEmailService.sendOverdueReminderEmail.mockRejectedValue(new Error('SendGrid error'));

      mockInvoiceModel.find.mockReturnValue({
        exec: vi.fn().mockResolvedValue([overdueInvoice]),
      });

      const checkTenant = (service as any).checkTenant.bind(service);
      await expect(checkTenant(mockTenantId, baseSettings)).resolves.not.toThrow();

      expect(mockEmailService.sendOverdueReminderEmail).toHaveBeenCalled();
    });
  });
});
