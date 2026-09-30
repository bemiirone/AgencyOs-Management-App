import { TestBed } from '@angular/core/testing';
import { InvoicePayloadBuilderService } from './invoice-payload-builder.service';
import { Project } from '../../../shared/models/project.model';
import { InvoiceFormValue } from '../invoice-form/invoice-form.types';
import { describe, it, expect, beforeEach } from 'vitest';

describe('InvoicePayloadBuilderService', () => {
  let service: InvoicePayloadBuilderService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [InvoicePayloadBuilderService],
    });
    service = TestBed.inject(InvoicePayloadBuilderService);
  });

  describe('mapExpenses', () => {
    it('should map form expenses to payload format', () => {
      const expenses = [{ description: 'Travel', amount: 100, date: '2024-01-15' }];
      const result = service.mapExpenses(expenses);

      expect(result).toHaveLength(1);
      expect(result[0].description).toBe('Travel');
      expect(result[0].amount).toBe(100);
      expect(result[0].date).toBeDefined();
    });

    it('should handle undefined expenses', () => {
      expect(service.mapExpenses(undefined)).toEqual([]);
    });

    it('should handle expenses without date', () => {
      const expenses = [{ description: 'Software', amount: 50 }];
      const result = service.mapExpenses(expenses as any);
      expect(result[0].date).toBeUndefined();
    });
  });

  describe('buildSharedFields', () => {
    it('should build shared payload fields', () => {
      const formValue: InvoiceFormValue = {
        projectId: 'proj-1',
        clientName: 'Test Client',
        clientEmail: 'test@example.com',
        billingType: 'hourly',
        subtotal: 1000,
        amount: 1200,
        tax: 200,
        dueDate: '2024-02-01',
        notes: 'Pay within 30 days',
      };

      const result = service.buildSharedFields(formValue);

      expect(result.billingType).toBe('hourly');
      expect(result.subtotal).toBe(1000);
      expect(result.amount).toBe(1200);
      expect(result.tax).toBe(200);
      expect(result.dueDate).toBeDefined();
      expect(result.notes).toBe('Pay within 30 days');
    });

    it('should handle missing optional fields', () => {
      const formValue: InvoiceFormValue = {
        projectId: 'proj-1',
        clientName: 'Test Client',
        clientEmail: 'test@example.com',
        billingType: 'hourly',
        subtotal: 1000,
        amount: 1000,
      };

      const result = service.buildSharedFields(formValue);

      expect(result.tax).toBe(0);
      expect(result.dueDate).toBeUndefined();
      expect(result.notes).toBeUndefined();
    });
  });

  describe('buildCreatePayload', () => {
    it('should build create payload with all fields', () => {
      const formValue: InvoiceFormValue = {
        projectId: 'proj-1',
        clientName: 'Test Client',
        clientEmail: 'test@example.com',
        billingType: 'hourly',
        hourlyRate: 100,
        dailyRate: 500,
        totalHours: 10,
        totalDays: 0,
        workDayHours: 8,
        overtimeRate: 1.5,
        overtimeHours: 2,
        subtotal: 1000,
        amount: 1000,
        tax: 0,
        startDate: '2024-01-01',
        endDate: '2024-01-31',
        dueDate: '2024-02-15',
        notes: 'Note',
        lineItems: [{ description: 'Item', quantity: 1, rate: 100, amount: 100 }],
        expenses: [{ description: 'Expense', amount: 50, date: '2024-01-15' }],
      };

      const project: Project = {
        _id: 'proj-1',
        name: 'Test Project',
        clientId: 'client-1',
        budget: 5000,
        status: 'active',
        clientName: 'Test Client',
        clientEmail: 'test@example.com',
        tenantId: 'tenant-1',
        ownerId: 'owner-1',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = service.buildCreatePayload(formValue, project, ['entry-1'], 'fetch');

      expect(result.projectId).toBe('proj-1');
      expect(result.clientName).toBe('Test Client');
      expect(result.clientEmail).toBe('test@example.com');
      expect(result.clientId).toBe('client-1');
      expect(result.billingType).toBe('hourly');
      expect(result.hourlyRate).toBe(100);
      expect(result.totalHours).toBe(10);
      expect(result.timeEntryIds).toEqual(['entry-1']);
      expect(result.dateRange).toBeDefined();
    });

    it('should include line items for manual billing', () => {
      const formValue: InvoiceFormValue = {
        projectId: 'proj-1',
        clientName: 'Test Client',
        clientEmail: 'test@example.com',
        billingType: 'manual',
        subtotal: 200,
        amount: 200,
        lineItems: [
          { description: 'Design', quantity: 5, rate: 100, amount: 500 },
          { description: 'Development', quantity: 10, rate: 150, amount: 1500 },
        ],
      };

      const result = service.buildCreatePayload(formValue, undefined);

      expect(result.lineItems).toHaveLength(2);
      expect(result.lineItems?.[0].description).toBe('Design');
      expect(result.lineItems?.[1].amount).toBe(1500);
    });

    it('should handle manual time input mode', () => {
      const formValue: InvoiceFormValue = {
        projectId: 'proj-1',
        clientName: 'Test Client',
        clientEmail: 'test@example.com',
        billingType: 'hourly',
        hourlyRate: 100,
        subtotal: 500,
        amount: 500,
        manualHours: 8,
        manualDays: 0,
      };

      const result = service.buildCreatePayload(formValue, undefined, undefined, 'manual');

      expect(result.manualHours).toBe(8);
    });
  });

  describe('buildUpdatePayload', () => {
    it('should build update payload', () => {
      const formValue: InvoiceFormValue = {
        projectId: 'proj-1',
        clientName: 'Updated Client',
        clientEmail: 'updated@example.com',
        billingType: 'daily',
        dailyRate: 600,
        totalDays: 5,
        subtotal: 3000,
        amount: 3000,
        tax: 300,
        dueDate: '2024-03-01',
        notes: 'Updated notes',
      };

      const result = service.buildUpdatePayload(formValue, undefined);

      expect(result.billingType).toBe('daily');
      expect(result.amount).toBe(3000);
      expect(result.tax).toBe(300);
      expect(result.notes).toBe('Updated notes');
    });
  });
});
