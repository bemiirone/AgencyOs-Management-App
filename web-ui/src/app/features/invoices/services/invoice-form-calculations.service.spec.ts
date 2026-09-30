import { TestBed } from '@angular/core/testing';
import { ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { InvoiceFormCalculationsService } from './invoice-form-calculations.service';
import { InvoiceFormControls } from './invoice-form-builder.service';
import { describe, it, expect, beforeEach } from 'vitest';

function createTestForm(): FormGroup<InvoiceFormControls> {
  return new FormGroup<InvoiceFormControls>({
    projectId: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    taskId: new FormControl('', { nonNullable: true }),
    clientName: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    clientEmail: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.email] }),
    billingType: new FormControl('hourly', { nonNullable: true }),
    lineItems: new FormControl([]) as any,
    expenses: new FormControl([]) as any,
    startDate: new FormControl('', { nonNullable: true }),
    endDate: new FormControl('', { nonNullable: true }),
    hourlyRate: new FormControl(100, { nonNullable: true }),
    dailyRate: new FormControl(500, { nonNullable: true }),
    totalHours: new FormControl(0, { nonNullable: true }),
    totalDays: new FormControl(0, { nonNullable: true }),
    manualHours: new FormControl(0, { nonNullable: true }),
    manualDays: new FormControl(0, { nonNullable: true }),
    workDayHours: new FormControl(8, { nonNullable: true }),
    overtimeRate: new FormControl(1.5, { nonNullable: true }),
    overtimeHours: new FormControl(0, { nonNullable: true }),
    subtotal: new FormControl(0, { nonNullable: true, validators: [Validators.required] }),
    amount: new FormControl(0, { nonNullable: true, validators: [Validators.required] }),
    tax: new FormControl(0, { nonNullable: true }),
    dueDate: new FormControl('', { nonNullable: true }),
    notes: new FormControl('', { nonNullable: true }),
  });
}

describe('InvoiceFormCalculationsService', () => {
  let service: InvoiceFormCalculationsService;
  let form: FormGroup<InvoiceFormControls>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ReactiveFormsModule],
      providers: [InvoiceFormCalculationsService],
    });
    service = TestBed.inject(InvoiceFormCalculationsService);
    form = createTestForm();
  });

  describe('roundToHalfHour', () => {
    it('should round down to nearest half hour', () => {
      expect(service.roundToHalfHour(1.1)).toBe(1);
      expect(service.roundToHalfHour(1.3)).toBe(1.5);
    });

    it('should round up to nearest half hour', () => {
      expect(service.roundToHalfHour(1.7)).toBe(1.5);
      expect(service.roundToHalfHour(1.8)).toBe(2);
    });

    it('should handle exact half hours', () => {
      expect(service.roundToHalfHour(1.5)).toBe(1.5);
      expect(service.roundToHalfHour(2)).toBe(2);
    });
  });

  describe('roundToHalfDay', () => {
    it('should round to nearest half day based on work day hours', () => {
      expect(service.roundToHalfDay(6, 8)).toBe(1);
      expect(service.roundToHalfDay(11, 8)).toBe(1.5);
      expect(service.roundToHalfDay(4, 8)).toBe(0.5);
    });

    it('should return 0 for zero or negative hours', () => {
      expect(service.roundToHalfDay(0, 8)).toBe(0);
      expect(service.roundToHalfDay(-1, 8)).toBe(0);
    });
  });

  describe('calculateManualAmount', () => {
    it('should calculate hourly amount correctly', () => {
      form.controls.billingType.setValue('hourly');
      form.controls.manualHours.setValue(5);
      form.controls.hourlyRate.setValue(100);

      service.calculateManualAmount(form, 'hourly');

      expect(form.controls.totalHours.value).toBe(5);
      expect(form.controls.amount.value).toBe(500);
      expect(form.controls.subtotal.value).toBe(500);
    });

    it('should calculate daily amount correctly', () => {
      form.controls.billingType.setValue('daily');
      form.controls.manualHours.setValue(11);
      form.controls.workDayHours.setValue(8);
      form.controls.dailyRate.setValue(500);

      service.calculateManualAmount(form, 'daily');

      expect(form.controls.totalDays.value).toBe(1.5);
      expect(form.controls.amount.value).toBe(750);
      expect(form.controls.subtotal.value).toBe(750);
    });

    it('should not calculate for budget billing type', () => {
      form.controls.amount.setValue(1000);
      service.calculateManualAmount(form, 'budget');
      expect(form.controls.amount.value).toBe(1000);
    });
  });

  describe('getRateForBillingType', () => {
    it('should return hourly rate for hourly billing', () => {
      form.controls.hourlyRate.setValue(75);
      expect(service.getRateForBillingType(form, 'hourly')).toBe(75);
    });

    it('should return daily rate for daily billing', () => {
      form.controls.dailyRate.setValue(400);
      expect(service.getRateForBillingType(form, 'daily')).toBe(400);
    });
  });

  describe('getHourlyOvertimeRate', () => {
    it('should calculate overtime rate for hourly billing', () => {
      form.controls.hourlyRate.setValue(100);
      form.controls.overtimeRate.setValue(1.5);
      expect(service.getHourlyOvertimeRate(form, 'hourly')).toBe(150);
    });

    it('should calculate overtime rate for daily billing', () => {
      form.controls.dailyRate.setValue(400);
      form.controls.workDayHours.setValue(8);
      form.controls.overtimeRate.setValue(1.5);
      expect(service.getHourlyOvertimeRate(form, 'daily')).toBe(75);
    });

    it('should return 0 for budget billing', () => {
      expect(service.getHourlyOvertimeRate(form, 'budget')).toBe(0);
    });
  });

  describe('calculateBillableAmount', () => {
    it('should calculate for hourly billing', () => {
      form.controls.totalHours.setValue(10);
      form.controls.hourlyRate.setValue(50);
      expect(service.calculateBillableAmount(form, 'hourly')).toBe(500);
    });

    it('should calculate for daily billing', () => {
      form.controls.totalDays.setValue(3);
      form.controls.dailyRate.setValue(200);
      expect(service.calculateBillableAmount(form, 'daily')).toBe(600);
    });

    it('should return amount for budget billing', () => {
      form.controls.amount.setValue(1000);
      expect(service.calculateBillableAmount(form, 'budget')).toBe(1000);
    });
  });

  describe('calculateOvertimeAmount', () => {
    it('should return 0 when no overtime hours', () => {
      expect(service.calculateOvertimeAmount(form, 'hourly', 0)).toBe(0);
    });

    it('should calculate overtime for hourly billing', () => {
      form.controls.hourlyRate.setValue(100);
      form.controls.overtimeRate.setValue(1.5);
      form.controls.overtimeHours.setValue(3);
      expect(service.calculateOvertimeAmount(form, 'hourly', 5)).toBe(450);
    });

    it('should cap overtime hours to available', () => {
      form.controls.hourlyRate.setValue(100);
      form.controls.overtimeRate.setValue(1.5);
      form.controls.overtimeHours.setValue(10);
      expect(service.calculateOvertimeAmount(form, 'hourly', 3)).toBe(450);
    });
  });

  describe('getEffectiveOvertimeHours', () => {
    it('should return requested hours if within available', () => {
      expect(service.getEffectiveOvertimeHours(form, 5)).toBe(0);
    });

    it('should cap to available overtime', () => {
      form.controls.overtimeHours.setValue(10);
      expect(service.getEffectiveOvertimeHours(form, 3)).toBe(3);
    });
  });

  describe('formatDuration', () => {
    it('should format seconds to hours and minutes', () => {
      expect(service.formatDuration(3600)).toBe('1h 0m');
      expect(service.formatDuration(7200)).toBe('2h 0m');
      expect(service.formatDuration(5400)).toBe('1h 30m');
      expect(service.formatDuration(3661)).toBe('1h 1m');
    });
  });

  describe('formatDate', () => {
    it('should format date string', () => {
      const result = service.formatDate('2024-01-15T00:00:00.000Z');
      expect(result).toContain('2024');
    });

    it('should format Date object', () => {
      const result = service.formatDate(new Date(2024, 0, 15));
      expect(result).toContain('2024');
    });
  });
});
