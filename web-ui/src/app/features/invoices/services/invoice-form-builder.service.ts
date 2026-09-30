import { Injectable, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormArray, FormControl } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DestroyRef } from '@angular/core';
import { Project } from '../../../shared/models/project.model';
import { InvoiceLineItem, InvoiceExpense } from '../../../shared/models/invoice.model';

export interface InvoiceFormControls {
  projectId: FormControl<string>;
  taskId: FormControl<string>;
  clientName: FormControl<string>;
  clientEmail: FormControl<string>;
  billingType: FormControl<string>;
  lineItems: FormArray;
  expenses: FormArray;
  startDate: FormControl<string>;
  endDate: FormControl<string>;
  hourlyRate: FormControl<number>;
  dailyRate: FormControl<number>;
  totalHours: FormControl<number>;
  totalDays: FormControl<number>;
  manualHours: FormControl<number>;
  manualDays: FormControl<number>;
  workDayHours: FormControl<number>;
  overtimeRate: FormControl<number>;
  overtimeHours: FormControl<number>;
  subtotal: FormControl<number>;
  amount: FormControl<number>;
  tax: FormControl<number>;
  dueDate: FormControl<string>;
  notes: FormControl<string>;
}

@Injectable({ providedIn: 'root' })
export class InvoiceFormBuilderService {
  private readonly fb = inject(FormBuilder);

  createForm(): FormGroup<InvoiceFormControls> {
    return this.fb.group<InvoiceFormControls>({
      projectId: this.fb.nonNullable.control('', Validators.required),
      taskId: this.fb.nonNullable.control(''),
      clientName: this.fb.nonNullable.control('', Validators.required),
      clientEmail: this.fb.nonNullable.control('', [Validators.required, Validators.email]),
      billingType: this.fb.nonNullable.control('budget', Validators.required),
      lineItems: this.fb.array<FormGroup<any>[]>([]),
      expenses: this.fb.array<FormGroup<any>[]>([]),
      startDate: this.fb.nonNullable.control(''),
      endDate: this.fb.nonNullable.control(''),
      hourlyRate: this.fb.nonNullable.control(0, Validators.required),
      dailyRate: this.fb.nonNullable.control(0, Validators.required),
      totalHours: this.fb.nonNullable.control(0),
      totalDays: this.fb.nonNullable.control(0),
      manualHours: this.fb.nonNullable.control(0),
      manualDays: this.fb.nonNullable.control(0),
      workDayHours: this.fb.nonNullable.control(8),
      overtimeRate: this.fb.nonNullable.control(1.5),
      overtimeHours: this.fb.nonNullable.control(0),
      subtotal: this.fb.nonNullable.control(0, Validators.required),
      amount: this.fb.nonNullable.control(0, Validators.required),
      tax: this.fb.nonNullable.control(0),
      dueDate: this.fb.nonNullable.control(''),
      notes: this.fb.nonNullable.control(''),
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
    form: FormGroup<InvoiceFormControls>,
    callbacks: {
      onProjectChange: (projectId: string) => void;
      onBillingTypeChange: (billingType: string) => void;
      onManualTimeChange: () => void;
      onRateChange: () => void;
      onOvertimeChange: () => void;
    },
    destroyRef: DestroyRef
  ): void {
    form.controls.projectId.valueChanges
      .pipe(takeUntilDestroyed(destroyRef))
      .subscribe((projectId) => callbacks.onProjectChange(projectId));

    form.controls.billingType.valueChanges
      .pipe(takeUntilDestroyed(destroyRef))
      .subscribe((billingType) => callbacks.onBillingTypeChange(billingType));

    form.controls.manualHours.valueChanges
      .pipe(takeUntilDestroyed(destroyRef))
      .subscribe(() => callbacks.onManualTimeChange());

    form.controls.manualDays.valueChanges
      .pipe(takeUntilDestroyed(destroyRef))
      .subscribe(() => callbacks.onManualTimeChange());

    form.controls.hourlyRate.valueChanges
      .pipe(takeUntilDestroyed(destroyRef))
      .subscribe(() => callbacks.onRateChange());

    form.controls.dailyRate.valueChanges
      .pipe(takeUntilDestroyed(destroyRef))
      .subscribe(() => callbacks.onRateChange());

    form.controls.workDayHours.valueChanges
      .pipe(takeUntilDestroyed(destroyRef))
      .subscribe(() => callbacks.onOvertimeChange());

    form.controls.overtimeHours.valueChanges
      .pipe(takeUntilDestroyed(destroyRef))
      .subscribe(() => callbacks.onOvertimeChange());

    form.controls.overtimeRate.valueChanges
      .pipe(takeUntilDestroyed(destroyRef))
      .subscribe(() => callbacks.onOvertimeChange());
  }

  populateFromProject(form: FormGroup<InvoiceFormControls>, project: Project): void {
    form.patchValue({
      clientName: project.clientName || '',
      clientEmail: project.clientEmail || '',
      amount: project.budget || 0,
      subtotal: project.budget || 0,
    });
  }
}
