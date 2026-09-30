import { Injectable } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { InvoiceFormControls } from './invoice-form-builder.service';

@Injectable({ providedIn: 'root' })
export class InvoiceFormCalculationsService {
  roundToHalfHour(hours: number): number {
    return Math.round(hours / 0.5) * 0.5;
  }

  roundToHalfDay(hours: number, workDayHours: number): number {
    if (hours <= 0) return 0;
    const halfDayHours = workDayHours / 2;
    const halfDayUnits = hours / halfDayHours;
    const roundedUnits = Math.round(halfDayUnits);
    return roundedUnits * 0.5;
  }

  calculateManualAmount(
    form: FormGroup<InvoiceFormControls>,
    billingType: string
  ): void {
    if (billingType === 'hourly') {
      const hours = form.controls.manualHours.value;
      const rate = form.controls.hourlyRate.value;
      const roundedHours = this.roundToHalfHour(hours);
      const amount = roundedHours * rate;
      form.patchValue({
        totalHours: roundedHours,
        amount: Math.round(amount * 100) / 100,
        subtotal: Math.round(amount * 100) / 100,
      }, { emitEvent: false });
    } else if (billingType === 'daily') {
      const hours = form.controls.manualHours.value;
      const workDayHours = form.controls.workDayHours.value;
      const rate = form.controls.dailyRate.value;
      const roundedDays = this.roundToHalfDay(hours, workDayHours);
      const amount = roundedDays * rate;
      form.patchValue({
        totalDays: roundedDays,
        amount: Math.round(amount * 100) / 100,
        subtotal: Math.round(amount * 100) / 100,
      }, { emitEvent: false });
    }
  }

  getRateForBillingType(form: FormGroup<InvoiceFormControls>, billingType: string): number {
    return billingType === 'hourly'
      ? form.controls.hourlyRate.value
      : form.controls.dailyRate.value;
  }

  getHourlyOvertimeRate(form: FormGroup<InvoiceFormControls>, billingType: string): number {
    const overtimeRateMultiplier = form.controls.overtimeRate.value;

    if (billingType === 'hourly') {
      const rate = form.controls.hourlyRate.value;
      return rate * overtimeRateMultiplier;
    }
    if (billingType === 'daily') {
      const dailyRate = form.controls.dailyRate.value;
      const workDayHours = form.controls.workDayHours.value;
      const hourlyBaseRate = workDayHours > 0 ? dailyRate / workDayHours : 0;
      return hourlyBaseRate * overtimeRateMultiplier;
    }
    return 0;
  }

  calculateBillableAmount(
    form: FormGroup<InvoiceFormControls>,
    billingType: string
  ): number {
    if (billingType === 'hourly') {
      const hours = form.controls.totalHours.value;
      const rate = form.controls.hourlyRate.value;
      return hours * rate;
    }
    if (billingType === 'daily') {
      const days = form.controls.totalDays.value;
      const rate = form.controls.dailyRate.value;
      return days * rate;
    }
    if (billingType === 'budget') {
      return form.controls.amount.value;
    }
    return 0;
  }

  calculateOvertimeAmount(
    form: FormGroup<InvoiceFormControls>,
    billingType: string,
    totalOvertimeHours: number
  ): number {
    if (totalOvertimeHours <= 0) return 0;

    const overtimeHours = form.controls.overtimeHours.value;
    const cappedHours = Math.min(overtimeHours, totalOvertimeHours);
    return cappedHours * this.getHourlyOvertimeRate(form, billingType);
  }

  calculateSelectedEntriesAmount(
    form: FormGroup<InvoiceFormControls>,
    billingType: string,
    calculationResult: { totalDays: number; totalOvertimeHours: number } | null
  ): void {
    if (billingType !== 'daily' || !calculationResult) return;

    const dailyRate = form.controls.dailyRate.value;
    const overtimeHours = form.controls.overtimeHours.value;
    const workDayHours = form.controls.workDayHours.value;
    const overtimeRateMultiplier = form.controls.overtimeRate.value;

    const cappedOvertimeHours = Math.min(overtimeHours, calculationResult.totalOvertimeHours);
    const hourlyBaseRate = workDayHours > 0 ? dailyRate / workDayHours : 0;
    const baseAmount = calculationResult.totalDays * dailyRate;
    const overtimeAmount = cappedOvertimeHours * hourlyBaseRate * overtimeRateMultiplier;
    const totalAmount = baseAmount + overtimeAmount;

    form.patchValue({
      totalDays: calculationResult.totalDays,
      amount: Math.round(totalAmount * 100) / 100,
      subtotal: Math.round(totalAmount * 100) / 100,
    }, { emitEvent: false });
  }

  getEffectiveOvertimeHours(
    form: FormGroup<InvoiceFormControls>,
    totalOvertimeHours: number
  ): number {
    const overtimeHours = form.controls.overtimeHours.value;
    return Math.min(overtimeHours, totalOvertimeHours);
  }

  formatDuration(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  }

  formatDate(date: Date | string): string {
    return new Date(date).toLocaleDateString();
  }
}
