import { Injectable } from '@angular/core';
import { FormGroup } from '@angular/forms';

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
    form: FormGroup,
    billingType: string
  ): void {
    if (billingType === 'hourly') {
      const hours = form.get('manualHours')?.value || 0;
      const rate = form.get('hourlyRate')?.value || 0;
      const roundedHours = this.roundToHalfHour(hours);
      const amount = roundedHours * rate;
      form.patchValue({
        totalHours: roundedHours,
        amount: Math.round(amount * 100) / 100,
        subtotal: Math.round(amount * 100) / 100,
      }, { emitEvent: false });
    } else if (billingType === 'daily') {
      const hours = form.get('manualHours')?.value || 0;
      const workDayHours = form.get('workDayHours')?.value || 8;
      const rate = form.get('dailyRate')?.value || 0;
      const roundedDays = this.roundToHalfDay(hours, workDayHours);
      const amount = roundedDays * rate;
      form.patchValue({
        totalDays: roundedDays,
        amount: Math.round(amount * 100) / 100,
        subtotal: Math.round(amount * 100) / 100,
      }, { emitEvent: false });
    }
  }

  getRateForBillingType(form: FormGroup, billingType: string): number {
    return billingType === 'hourly'
      ? form.get('hourlyRate')?.value || 0
      : form.get('dailyRate')?.value || 0;
  }

  getHourlyOvertimeRate(form: FormGroup, billingType: string): number {
    const overtimeRateMultiplier = form.get('overtimeRate')?.value || 1.5;

    if (billingType === 'hourly') {
      const rate = form.get('hourlyRate')?.value || 0;
      return rate * overtimeRateMultiplier;
    }
    if (billingType === 'daily') {
      const dailyRate = form.get('dailyRate')?.value || 0;
      const workDayHours = form.get('workDayHours')?.value || 8;
      const hourlyBaseRate = workDayHours > 0 ? dailyRate / workDayHours : 0;
      return hourlyBaseRate * overtimeRateMultiplier;
    }
    return 0;
  }

  calculateBillableAmount(
    form: FormGroup,
    billingType: string
  ): number {
    if (billingType === 'hourly') {
      const hours = form.get('totalHours')?.value || 0;
      const rate = form.get('hourlyRate')?.value || 0;
      return hours * rate;
    }
    if (billingType === 'daily') {
      const days = form.get('totalDays')?.value || 0;
      const rate = form.get('dailyRate')?.value || 0;
      return days * rate;
    }
    if (billingType === 'budget') {
      return form.get('amount')?.value || 0;
    }
    return 0;
  }

  calculateOvertimeAmount(
    form: FormGroup,
    billingType: string,
    totalOvertimeHours: number
  ): number {
    if (totalOvertimeHours <= 0) return 0;

    const overtimeHours = form.get('overtimeHours')?.value || 0;
    const cappedHours = Math.min(overtimeHours, totalOvertimeHours);
    return cappedHours * this.getHourlyOvertimeRate(form, billingType);
  }

  calculateSelectedEntriesAmount(
    form: FormGroup,
    billingType: string,
    calculationResult: { totalDays: number; totalOvertimeHours: number } | null
  ): void {
    if (billingType !== 'daily' || !calculationResult) return;

    const dailyRate = form.get('dailyRate')?.value || 0;
    const overtimeHours = form.get('overtimeHours')?.value || 0;
    const workDayHours = form.get('workDayHours')?.value || 8;
    const overtimeRateMultiplier = form.get('overtimeRate')?.value || 1.5;

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
    form: FormGroup,
    totalOvertimeHours: number
  ): number {
    const overtimeHours = form.get('overtimeHours')?.value || 0;
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
