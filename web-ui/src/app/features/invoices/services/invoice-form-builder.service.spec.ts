import { describe, it, expect, beforeEach, vi } from 'vitest';
import { InvoiceFormBuilderService } from './invoice-form-builder.service';
import { FormBuilder, ReactiveFormsModule, Validators, FormArray } from '@angular/forms';
import { TestBed } from '@angular/core/testing';

describe('InvoiceFormBuilderService', () => {
  let service: InvoiceFormBuilderService;
  let fb: FormBuilder;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ReactiveFormsModule],
      providers: [InvoiceFormBuilderService, FormBuilder],
    });
    service = TestBed.inject(InvoiceFormBuilderService);
    fb = TestBed.inject(FormBuilder);
  });

  function getLineItems(form: any): FormArray {
    return form.get('lineItems');
  }

  function getExpenses(form: any): FormArray {
    return form.get('expenses');
  }

  describe('createForm', () => {
    it('should create a form with all required fields', () => {
      const form = service.createForm();
      expect(form.get('projectId')).toBeTruthy();
      expect(form.get('billingType')).toBeTruthy();
      expect(form.get('clientName')).toBeTruthy();
      expect(form.get('clientEmail')).toBeTruthy();
      expect(form.get('hourlyRate')).toBeTruthy();
      expect(form.get('dailyRate')).toBeTruthy();
      expect(form.get('lineItems')).toBeTruthy();
      expect(form.get('expenses')).toBeTruthy();
    });

    it('should set correct default values', () => {
      const form = service.createForm();
      expect(form.get('billingType')?.value).toBe('budget');
      expect(form.get('hourlyRate')?.value).toBe(0);
      expect(form.get('dailyRate')?.value).toBe(0);
      expect(form.get('totalHours')?.value).toBe(0);
      expect(form.get('totalDays')?.value).toBe(0);
      expect(form.get('workDayHours')?.value).toBe(8);
      expect(form.get('overtimeRate')?.value).toBe(1.5);
      expect(form.get('overtimeHours')?.value).toBe(0);
      expect(form.get('subtotal')?.value).toBe(0);
      expect(form.get('amount')?.value).toBe(0);
      expect(form.get('tax')?.value).toBe(0);
    });

    it('should have required validators on projectId', () => {
      const form = service.createForm();
      const control = form.get('projectId');
      control?.setValue('');
      expect(control?.hasError('required')).toBe(true);
    });

    it('should have required validators on clientName', () => {
      const form = service.createForm();
      const control = form.get('clientName');
      control?.setValue('');
      expect(control?.hasError('required')).toBe(true);
    });

    it('should have email validator on clientEmail', () => {
      const form = service.createForm();
      const control = form.get('clientEmail');
      control?.setValue('invalid-email');
      expect(control?.hasError('email')).toBe(true);
    });

    it('should have required validator on billingType', () => {
      const form = service.createForm();
      const control = form.get('billingType');
      control?.setValue('');
      expect(control?.hasError('required')).toBe(true);
    });

    it('should have required validators on hourlyRate', () => {
      const form = service.createForm();
      const control = form.get('hourlyRate');
      control?.setValue(null as any);
      expect(control?.hasError('required')).toBe(true);
    });

    it('should start with empty lineItems and expenses', () => {
      const form = service.createForm();
      expect(getLineItems(form)?.length).toBe(0);
      expect(getExpenses(form)?.length).toBe(0);
    });
  });

  describe('createLineItemGroup', () => {
    it('should create a line item group with default values', () => {
      const group = service.createLineItemGroup();
      expect(group.get('description')?.value).toBe('');
      expect(group.get('quantity')?.value).toBe(1);
      expect(group.get('rate')?.value).toBe(0);
      expect(group.get('amount')?.value).toBe(0);
    });

    it('should create a line item group with provided values', () => {
      const group = service.createLineItemGroup({
        description: 'Development',
        quantity: 10,
        rate: 150,
        amount: 1500,
      });
      expect(group.get('description')?.value).toBe('Development');
      expect(group.get('quantity')?.value).toBe(10);
      expect(group.get('rate')?.value).toBe(150);
      expect(group.get('amount')?.value).toBe(1500);
    });

    it('should have required validators', () => {
      const group = service.createLineItemGroup();
      expect(group.get('description')?.hasError('required')).toBe(true);
      group.get('quantity')?.setValue(null as any);
      expect(group.get('quantity')?.hasError('required')).toBe(true);
      group.get('rate')?.setValue(null as any);
      expect(group.get('rate')?.hasError('required')).toBe(true);
      group.get('amount')?.setValue(null as any);
      expect(group.get('amount')?.hasError('required')).toBe(true);
    });
  });

  describe('createExpenseGroup', () => {
    it('should create an expense group with default values', () => {
      const group = service.createExpenseGroup();
      expect(group.get('description')?.value).toBe('');
      expect(group.get('amount')?.value).toBe(0);
      expect(group.get('date')?.value).toBe('');
    });

    it('should create an expense group with provided values', () => {
      const group = service.createExpenseGroup({
        description: 'Travel',
        amount: 250,
        date: new Date('2024-01-15'),
      });
      expect(group.get('description')?.value).toBe('Travel');
      expect(group.get('amount')?.value).toBe(250);
      expect(group.get('date')?.value).toBe('2024-01-15');
    });
  });

  describe('addLineItem', () => {
    it('should add a line item to the array', () => {
      const form = service.createForm();
      const lineItems = getLineItems(form);
      service.addLineItem(lineItems);
      expect(lineItems.length).toBe(1);
    });

    it('should add a line item with values', () => {
      const form = service.createForm();
      const lineItems = getLineItems(form);
      service.addLineItem(lineItems, { description: 'Test', quantity: 2, rate: 50, amount: 100 });
      expect(lineItems.length).toBe(1);
      expect(lineItems.at(0).get('description')?.value).toBe('Test');
    });
  });

  describe('addExpense', () => {
    it('should add an expense to the array', () => {
      const form = service.createForm();
      const expenses = getExpenses(form);
      service.addExpense(expenses);
      expect(expenses.length).toBe(1);
    });
  });

  describe('clearArray', () => {
    it('should clear a form array', () => {
      const form = service.createForm();
      const lineItems = getLineItems(form);
      service.addLineItem(lineItems);
      service.addLineItem(lineItems);
      service.clearArray(lineItems);
      expect(lineItems.length).toBe(0);
    });
  });

  describe('updateLineItemAmounts', () => {
    it('should calculate amount for each line item', () => {
      const form = service.createForm();
      const lineItems = getLineItems(form);
      service.addLineItem(lineItems, { description: 'Item', quantity: 5, rate: 100, amount: 500 });
      service.addLineItem(lineItems, { description: 'Item', quantity: 3, rate: 50, amount: 150 });

      service.updateLineItemAmounts(lineItems, 'manual');

      expect(lineItems.at(0).get('amount')?.value).toBe(500);
      expect(lineItems.at(1).get('amount')?.value).toBe(150);
    });

    it('should update subtotal for manual billing', () => {
      const form = service.createForm();
      const lineItems = getLineItems(form);
      service.addLineItem(lineItems, { description: 'Item', quantity: 5, rate: 100, amount: 500 });
      service.addLineItem(lineItems, { description: 'Item', quantity: 3, rate: 50, amount: 150 });

      service.updateLineItemAmounts(lineItems, 'manual', (total) => {
        expect(total).toBe(650);
      });
    });

    it('should not update subtotal for non-manual billing', () => {
      const form = service.createForm();
      const lineItems = getLineItems(form);
      service.addLineItem(lineItems, { description: 'Item', quantity: 5, rate: 100, amount: 500 });

      const onSubtotalUpdate = vi.fn();
      service.updateLineItemAmounts(lineItems, 'hourly', onSubtotalUpdate);
      expect(onSubtotalUpdate).not.toHaveBeenCalled();
    });
  });

  describe('updateExpenseTotals', () => {
    it('should calculate total and call callback', () => {
      const form = service.createForm();
      const expenses = getExpenses(form);
      service.addExpense(expenses, { description: 'Expense', amount: 100 });
      service.addExpense(expenses, { description: 'Expense 1', amount: 250 });

      const onSubtotalUpdate = vi.fn();
      service.updateExpenseTotals(expenses, 1000, onSubtotalUpdate);

      expect(onSubtotalUpdate).toHaveBeenCalledWith(1350);
    });
  });

  describe('populateFromProject', () => {
    it('should populate form from project data', () => {
      const form = service.createForm();
      const project = {
        clientName: 'Project Client',
        clientEmail: 'project@test.com',
        budget: 5000,
      } as any;

      service.populateFromProject(form, project);

      expect(form.get('clientName')?.value).toBe('Project Client');
      expect(form.get('clientEmail')?.value).toBe('project@test.com');
      expect(form.get('amount')?.value).toBe(5000);
      expect(form.get('subtotal')?.value).toBe(5000);
    });
  });

  describe('setupFormSubscriptions', () => {
    it('should subscribe to projectId changes', () => {
      const form = service.createForm();
      const onProjectChange = vi.fn();
      const destroyRef = { onDestroy: vi.fn() } as unknown as any;

      service.setupFormSubscriptions(form, {
        onProjectChange,
        onBillingTypeChange: vi.fn(),
        onManualTimeChange: vi.fn(),
        onRateChange: vi.fn(),
        onOvertimeChange: vi.fn(),
      }, destroyRef);

      form.get('projectId')?.setValue('proj-1');
      expect(onProjectChange).toHaveBeenCalledWith('proj-1');
    });

    it('should subscribe to billingType changes', () => {
      const form = service.createForm();
      const onBillingTypeChange = vi.fn();
      const destroyRef = { onDestroy: vi.fn() } as unknown as any;

      service.setupFormSubscriptions(form, {
        onProjectChange: vi.fn(),
        onBillingTypeChange,
        onManualTimeChange: vi.fn(),
        onRateChange: vi.fn(),
        onOvertimeChange: vi.fn(),
      }, destroyRef);

      form.get('billingType')?.setValue('hourly');
      expect(onBillingTypeChange).toHaveBeenCalledWith('hourly');
    });
  });
});
