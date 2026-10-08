import { Injectable } from '@angular/core';
import { Project } from '../../../shared/models/project.model';
import { CreateInvoicePayload, UpdateInvoicePayload } from '../../../stores/invoice.types';
import { InvoiceFormValue, InvoiceFormExpense, InvoiceExpensePayload } from '../invoice-form/invoice-form.types';

@Injectable({ providedIn: 'root' })
export class InvoicePayloadBuilderService {
  mapExpenses(expenses: InvoiceFormValue['expenses']): InvoiceExpensePayload[] {
    if (!expenses) return [];
    return expenses.map((expense) => ({
      description: expense.description || '',
      amount: expense.amount || 0,
      date: expense.date ? new Date(expense.date).toISOString() : undefined,
    }));
  }

  buildSharedFields(formValue: InvoiceFormValue) {
    return {
      billingType: formValue.billingType as 'budget' | 'hourly' | 'daily' | 'manual',
      subtotal: formValue.subtotal ?? 0,
      amount: formValue.amount ?? 0,
      tax: formValue.tax || 0,
      dueDate: formValue.dueDate ? new Date(formValue.dueDate).toISOString() : undefined,
      notes: formValue.notes || undefined,
      sendOverdueReminders: formValue.sendOverdueReminders || false,
    };
  }

  buildBillingFields(formValue: InvoiceFormValue, payload: CreateInvoicePayload | UpdateInvoicePayload, timeEntryIds?: string[], timeInputMode?: 'fetch' | 'manual'): void {
    if (formValue.billingType === 'hourly' || formValue.billingType === 'daily') {
      payload.hourlyRate = formValue.hourlyRate;
      payload.dailyRate = formValue.dailyRate;
      payload.totalHours = formValue.totalHours;
      payload.totalDays = formValue.totalDays;
      payload.workDayHours = formValue.workDayHours;
      payload.overtimeRate = formValue.overtimeRate;
      payload.overtimeHours = formValue.overtimeHours;
      if (formValue.startDate && formValue.endDate) {
        payload.dateRange = {
          startDate: new Date(formValue.startDate).toISOString(),
          endDate: new Date(formValue.endDate).toISOString(),
        };
      }
      if (timeEntryIds && timeEntryIds.length > 0) {
        payload.timeEntryIds = timeEntryIds;
      }
      if (timeInputMode === 'manual') {
        (payload as CreateInvoicePayload).manualHours = formValue.manualHours;
        (payload as CreateInvoicePayload).manualDays = formValue.manualDays;
      }
    }
  }

  buildCommonPayloadFields(
    formValue: InvoiceFormValue,
    payload: CreateInvoicePayload | UpdateInvoicePayload,
    project: Project | undefined,
    timeEntryIds?: string[],
    timeInputMode?: 'fetch' | 'manual'
  ): void {
    if (project?.clientId) {
      payload.clientId = project.clientId;
    }

    if (formValue.taskId) {
      payload.taskId = formValue.taskId;
    }

    this.buildBillingFields(formValue, payload, timeEntryIds, timeInputMode);

    if (formValue.billingType === 'manual' && formValue.lineItems?.length) {
      payload.lineItems = formValue.lineItems.map((item) => ({
        description: item.description || '',
        quantity: item.quantity ?? 1,
        rate: item.rate ?? 0,
        amount: item.amount ?? 0,
      }));
    }

    if (formValue.expenses?.length) {
      payload.expenses = this.mapExpenses(formValue.expenses);
    }
  }

  buildCreatePayload(
    formValue: InvoiceFormValue,
    project: Project | undefined,
    timeEntryIds?: string[],
    timeInputMode?: 'fetch' | 'manual'
  ): CreateInvoicePayload {
    const payload: CreateInvoicePayload = {
      projectId: formValue.projectId,
      clientName: formValue.clientName,
      clientEmail: formValue.clientEmail,
      ...this.buildSharedFields(formValue),
    };

    this.buildCommonPayloadFields(formValue, payload, project, timeEntryIds, timeInputMode);
    return payload;
  }

  buildUpdatePayload(
    formValue: InvoiceFormValue,
    project: Project | undefined,
    timeEntryIds?: string[],
    timeInputMode?: 'fetch' | 'manual'
  ): UpdateInvoicePayload {
    const payload: UpdateInvoicePayload = {
      ...this.buildSharedFields(formValue),
    };

    this.buildCommonPayloadFields(formValue, payload, project, timeEntryIds, timeInputMode);
    return payload;
  }
}
