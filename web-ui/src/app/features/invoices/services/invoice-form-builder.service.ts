import { Injectable, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DestroyRef } from '@angular/core';
import { Project } from '../../../shared/models/project.model';
import { InvoiceLineItem, InvoiceExpense } from '../../../shared/models/invoice.model';

export interface InvoiceFormControls {
  projectId: string;
  taskId: string;
  clientName: string;
  clientEmail: string;
  billingType: string;
  lineItems: any[];
  expenses: any[];
  startDate: string;
  endDate: string;
  hourlyRate: number;
  dailyRate: number;
  totalHours: number;
  totalDays: number;
  manualHours: number;
  manualDays: number;
  workDayHours: number;
  overtimeRate: number;
  overtimeHours: number;
  subtotal: number;
  amount: number;
  tax: number;
  dueDate: string;
  notes: string;
}

@Injectable({ providedIn: 'root' })
export class InvoiceFormBuilderService {
  private readonly fb = inject(FormBuilder);

  createForm(): FormGroup {
    return this.fb.group({
      projectId: ['', Validators.required],
      taskId: [''],
      clientName: ['', Validators.required],
      clientEmail: ['', [Validators.required, Validators.email]],
      billingType: ['budget', Validators.required],
      lineItems: this.fb.array<FormGroup<any>[]>([]),
      expenses: this.fb.array<FormGroup<any>[]>([]),
      startDate: [''],
      endDate: [''],
      hourlyRate: [0, Validators.required],
      dailyRate: [0, Validators.required],
      totalHours: [0],
      totalDays: [0],
      manualHours: [0],
      manualDays: [0],
      workDayHours: [8],
      overtimeRate: [1.5],
      overtimeHours: [0],
      subtotal: [0, Validators.required],
      amount: [0, Validators.required],
      tax: [0],
      dueDate: [''],
      notes: [''],
    });
  }

  createLineItemGroup(item?: InvoiceLineItem): FormGroup {
    return this.fb.group({
      description: [item?.description || '', Validators.required],
      quantity: [item?.quantity || 1, [Validators.required, Validators.min(0)]],
      rate: [item?.rate || 0, [Validators.required, Validators.min(0)]],
      amount: [item?.amount || 0, [Validators.required, Validators.min(0)]],
    });
  }

  createExpenseGroup(expense?: InvoiceExpense): FormGroup {
    return this.fb.group({
      description: [expense?.description || '', Validators.required],
      amount: [expense?.amount || 0, [Validators.required, Validators.min(0)]],
      date: [expense?.date ? new Date(expense.date).toISOString().split('T')[0] : ''],
    });
  }

  addLineItem(lineItems: FormArray, item?: InvoiceLineItem): void {
    lineItems.push(this.createLineItemGroup(item));
  }

  addExpense(expenses: FormArray, expense?: InvoiceExpense): void {
    expenses.push(this.createExpenseGroup(expense));
  }

  clearArray(arr: FormArray): void {
    while (arr.length) {
      arr.removeAt(0);
    }
  }

  updateLineItemAmounts(lineItems: FormArray, billingType: string, onSubtotalUpdate?: (total: number) => void): void {
    lineItems.controls.forEach((control) => {
      const quantity = control.get('quantity')?.value || 0;
      const rate = control.get('rate')?.value || 0;
      control.get('amount')?.setValue(quantity * rate, { emitEvent: false });
    });

    if (billingType === 'manual' && onSubtotalUpdate) {
      const total = lineItems.controls.reduce(
        (sum, control) => sum + (control.get('amount')?.value || 0), 0
      );
      onSubtotalUpdate(total);
    }
  }

  updateExpenseTotals(expenses: FormArray, baseAmount: number, onSubtotalUpdate: (total: number) => void): void {
    const total = expenses.controls.reduce(
      (sum, control) => sum + (control.get('amount')?.value || 0), 0
    );
    onSubtotalUpdate(baseAmount + total);
  }

  setupFormSubscriptions(
    form: FormGroup,
    callbacks: {
      onProjectChange: (projectId: string) => void;
      onBillingTypeChange: (billingType: string) => void;
      onManualTimeChange: () => void;
      onRateChange: () => void;
      onOvertimeChange: () => void;
    },
    destroyRef: DestroyRef
  ): void {
    form.get('projectId')?.valueChanges
      .pipe(takeUntilDestroyed(destroyRef))
      .subscribe((projectId: string) => callbacks.onProjectChange(projectId));

    form.get('billingType')?.valueChanges
      .pipe(takeUntilDestroyed(destroyRef))
      .subscribe((billingType) => callbacks.onBillingTypeChange(billingType));

    form.get('manualHours')?.valueChanges
      .pipe(takeUntilDestroyed(destroyRef))
      .subscribe(() => callbacks.onManualTimeChange());

    form.get('manualDays')?.valueChanges
      .pipe(takeUntilDestroyed(destroyRef))
      .subscribe(() => callbacks.onManualTimeChange());

    form.get('hourlyRate')?.valueChanges
      .pipe(takeUntilDestroyed(destroyRef))
      .subscribe(() => callbacks.onRateChange());

    form.get('dailyRate')?.valueChanges
      .pipe(takeUntilDestroyed(destroyRef))
      .subscribe(() => callbacks.onRateChange());

    form.get('workDayHours')?.valueChanges
      .pipe(takeUntilDestroyed(destroyRef))
      .subscribe(() => callbacks.onOvertimeChange());

    form.get('overtimeHours')?.valueChanges
      .pipe(takeUntilDestroyed(destroyRef))
      .subscribe(() => callbacks.onOvertimeChange());

    form.get('overtimeRate')?.valueChanges
      .pipe(takeUntilDestroyed(destroyRef))
      .subscribe(() => callbacks.onOvertimeChange());
  }

  populateFromProject(form: FormGroup, project: Project): void {
    form.patchValue({
      clientName: project.clientName || '',
      clientEmail: project.clientEmail || '',
      amount: project.budget || 0,
      subtotal: project.budget || 0,
    });
  }
}
