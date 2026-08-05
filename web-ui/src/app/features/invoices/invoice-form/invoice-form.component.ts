import { Component, signal, inject, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faArrowLeft, faSpinner, faSave, faPlus, faTrash, faClock } from '@fortawesome/free-solid-svg-icons';
import { InvoiceStore, CreateInvoicePayload } from '../../../stores/invoice.store';
import { ProjectStore } from '../../../stores/project.store';
import { Project } from '../../../shared/models/project.model';
import { Invoice, InvoiceLineItem, PaymentStage, InvoiceExpense, TimeAggregationResult } from '../../../shared/models/invoice.model';

@Component({
  selector: 'app-invoice-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, FontAwesomeModule],
  templateUrl: './invoice-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InvoiceFormComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly invoiceStore = inject(InvoiceStore);
  private readonly projectStore = inject(ProjectStore);
  private readonly fb = inject(FormBuilder);

  readonly mode = signal<'create' | 'edit'>('create');
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly error = signal('');
  readonly invoiceId = signal('');
  readonly projects = signal<Project[]>([]);
  readonly aggregatingTime = signal(false);
  readonly timeInputMode = signal<'fetch' | 'manual'>('fetch');

  readonly faArrowLeft = faArrowLeft;
  readonly faSpinner = faSpinner;
  readonly faSave = faSave;
  readonly faPlus = faPlus;
  readonly faTrash = faTrash;
  readonly faClock = faClock;

  invoiceForm: FormGroup = this.fb.group({
    projectId: ['', Validators.required],
    clientName: ['', Validators.required],
    clientEmail: ['', [Validators.required, Validators.email]],
    billingType: ['budget', Validators.required],
    lineItems: this.fb.array([]),
    paymentStages: this.fb.array([]),
    expenses: this.fb.array([]),
    startDate: [''],
    endDate: [''],
    hourlyRate: [0],
    dailyRate: [0],
    totalHours: [0],
    totalDays: [0],
    manualHours: [0],
    manualDays: [0],
    workDayHours: [8],
    subtotal: [0, Validators.required],
    amount: [0, Validators.required],
    tax: [0],
    dueDate: [''],
    notes: [''],
  });

  get lineItems(): FormArray {
    return this.invoiceForm.get('lineItems') as FormArray;
  }

  get paymentStages(): FormArray {
    return this.invoiceForm.get('paymentStages') as FormArray;
  }

  get expenses(): FormArray {
    return this.invoiceForm.get('expenses') as FormArray;
  }

  get billingType(): string {
    return this.invoiceForm.get('billingType')?.value;
  }

  get showLineItems(): boolean {
    return this.billingType === 'manual';
  }

  get showTimeSection(): boolean {
    return this.billingType === 'hourly' || this.billingType === 'daily';
  }

  get showTimeFetch(): boolean {
    return this.showTimeSection && this.timeInputMode() === 'fetch';
  }

  get showTimeManual(): boolean {
    return this.showTimeSection && this.timeInputMode() === 'manual';
  }

  get showProjectBudget(): boolean {
    return this.billingType === 'budget';
  }

  get showPaymentStagesToggle(): boolean {
    return this.billingType === 'budget';
  }

  get showPaymentStages(): boolean {
    return this.showPaymentStagesToggle && this.paymentStages.length > 0;
  }

  get subtotal(): number {
    return this.invoiceForm.get('subtotal')?.value || 0;
  }

  get tax(): number {
    return this.invoiceForm.get('tax')?.value || 0;
  }

  get total(): number {
    return this.subtotal + this.tax;
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');

    this.projectStore.loadAllProjects().subscribe({
      next: (response) => {
        this.projects.set(response.data);
      },
      error: (err) => console.error('Failed to load projects:', err),
    });

    if (id) {
      this.mode.set('edit');
      this.invoiceId.set(id);
      this.loading.set(true);

      this.invoiceStore.loadInvoice(id).subscribe({
        next: (invoice: Invoice) => {
          this.invoiceForm.patchValue({
            projectId: invoice.projectId,
            clientName: invoice.clientName,
            clientEmail: invoice.clientEmail,
            billingType: invoice.billingType,
            hourlyRate: invoice.hourlyRate || 0,
            dailyRate: invoice.dailyRate || 0,
            totalHours: invoice.totalHours || 0,
            totalDays: invoice.totalDays || 0,
            subtotal: invoice.subtotal,
            amount: invoice.amount,
            tax: invoice.tax || 0,
            dueDate: invoice.dueDate ? new Date(invoice.dueDate).toISOString().split('T')[0] : '',
            notes: invoice.notes || '',
            startDate: invoice.dateRange?.startDate ? new Date(invoice.dateRange.startDate).toISOString().split('T')[0] : '',
            endDate: invoice.dateRange?.endDate ? new Date(invoice.dateRange.endDate).toISOString().split('T')[0] : '',
          });

          if (invoice.lineItems?.length) {
            invoice.lineItems.forEach((item) => this.addLineItem(item));
          }

          if (invoice.paymentStages?.length) {
            invoice.paymentStages.forEach((stage) => this.addPaymentStage(stage));
          }

          if (invoice.expenses?.length) {
            invoice.expenses.forEach((expense) => this.addExpense(expense));
          }

          this.loading.set(false);
        },
        error: () => {
          this.error.set('Failed to load invoice');
          this.loading.set(false);
        },
      });
    } else {
      this.mode.set('create');
      this.addLineItem();
    }

    this.invoiceForm.get('projectId')?.valueChanges.subscribe((projectId) => {
      if (projectId) {
        const project = this.projects().find((p) => p._id === projectId);
        if (project) {
          this.invoiceForm.patchValue({
            clientName: project.clientName || '',
            clientEmail: project.clientEmail || '',
            amount: project.budget || 0,
            subtotal: project.budget || 0,
          });
        }
      }
    });

    this.invoiceForm.get('billingType')?.valueChanges.subscribe((billingType) => {
      if (billingType !== 'budget') {
        this.clearPaymentStages();
      }
      if (billingType === 'hourly' || billingType === 'daily') {
        this.timeInputMode.set('fetch');
      }
    });

    this.invoiceForm.get('tax')?.valueChanges.subscribe(() => {
      this.updateTotals();
    });

    this.invoiceForm.get('manualHours')?.valueChanges.subscribe(() => {
      this.calculateManualAmount();
    });

    this.invoiceForm.get('manualDays')?.valueChanges.subscribe(() => {
      this.calculateManualAmount();
    });

    this.invoiceForm.get('hourlyRate')?.valueChanges.subscribe(() => {
      if (this.timeInputMode() === 'manual' && this.billingType === 'hourly') {
        this.calculateManualAmount();
      }
    });

    this.invoiceForm.get('dailyRate')?.valueChanges.subscribe(() => {
      if (this.timeInputMode() === 'manual' && this.billingType === 'daily') {
        this.calculateManualAmount();
      }
    });
  }

  addLineItem(item?: InvoiceLineItem): void {
    this.lineItems.push(
      this.fb.group({
        description: [item?.description || '', Validators.required],
        quantity: [item?.quantity || 1, [Validators.required, Validators.min(0)]],
        rate: [item?.rate || 0, [Validators.required, Validators.min(0)]],
        amount: [item?.amount || 0, [Validators.required, Validators.min(0)]],
      })
    );
    this.updateLineItemAmounts();
  }

  removeLineItem(index: number): void {
    this.lineItems.removeAt(index);
    this.updateLineItemAmounts();
  }

  addPaymentStage(stage?: PaymentStage): void {
    this.paymentStages.push(
      this.fb.group({
        name: [stage?.name || '', Validators.required],
        percentage: [stage?.percentage || 0, [Validators.required, Validators.min(0), Validators.max(100)]],
        dueDate: [stage?.dueDate ? new Date(stage.dueDate).toISOString().split('T')[0] : ''],
      })
    );
  }

  removePaymentStage(index: number): void {
    this.paymentStages.removeAt(index);
  }

  clearPaymentStages(): void {
    while (this.paymentStages.length) {
      this.paymentStages.removeAt(0);
    }
  }

  togglePaymentStages(checked: boolean): void {
    if (checked && this.paymentStages.length === 0) {
      this.addPaymentStage();
    } else if (!checked) {
      this.clearPaymentStages();
    }
  }

  addExpense(expense?: InvoiceExpense): void {
    this.expenses.push(
      this.fb.group({
        description: [expense?.description || '', Validators.required],
        amount: [expense?.amount || 0, [Validators.required, Validators.min(0)]],
        date: [expense?.date ? new Date(expense.date).toISOString().split('T')[0] : ''],
      })
    );
    this.updateExpenseTotals();
  }

  removeExpense(index: number): void {
    this.expenses.removeAt(index);
    this.updateExpenseTotals();
  }

  clearExpenses(): void {
    while (this.expenses.length) {
      this.expenses.removeAt(0);
    }
    this.updateExpenseTotals();
  }

  updateLineItemAmounts(): void {
    this.lineItems.controls.forEach((control) => {
      const quantity = control.get('quantity')?.value || 0;
      const rate = control.get('rate')?.value || 0;
      control.get('amount')?.setValue(quantity * rate, { emitEvent: false });
    });

    if (this.billingType === 'manual') {
      const lineItemTotal = this.lineItems.controls.reduce(
        (sum, control) => sum + (control.get('amount')?.value || 0), 0
      );
      this.invoiceForm.get('subtotal')?.setValue(lineItemTotal, { emitEvent: false });
    }
  }

  updateExpenseTotals(): void {
    const expensesTotal = this.expenses.controls.reduce(
      (sum, control) => sum + (control.get('amount')?.value || 0), 0
    );

    const baseAmount = this.invoiceForm.get('amount')?.value || 0;
    this.invoiceForm.get('subtotal')?.setValue(baseAmount + expensesTotal, { emitEvent: false });
  }

  updateTotals(): void {
    // Totals are computed in the template via getter
  }

  onLineItemChange(): void {
    this.updateLineItemAmounts();
  }

  onTimeInputModeChange(mode: 'fetch' | 'manual'): void {
    this.timeInputMode.set(mode);
    if (mode === 'manual') {
      this.invoiceForm.patchValue({
        totalHours: 0,
        totalDays: 0,
        amount: 0,
        subtotal: 0,
      });
    }
  }

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

  calculateManualAmount(): void {
    if (this.billingType === 'hourly') {
      const hours = this.invoiceForm.get('manualHours')?.value || 0;
      const rate = this.invoiceForm.get('hourlyRate')?.value || 0;
      const roundedHours = this.roundToHalfHour(hours);
      const amount = roundedHours * rate;
      this.invoiceForm.patchValue({
        totalHours: roundedHours,
        amount: Math.round(amount * 100) / 100,
        subtotal: Math.round(amount * 100) / 100,
      }, { emitEvent: false });
    } else if (this.billingType === 'daily') {
      const hours = this.invoiceForm.get('manualHours')?.value || 0;
      const workDayHours = this.invoiceForm.get('workDayHours')?.value || 8;
      const rate = this.invoiceForm.get('dailyRate')?.value || 0;
      const roundedDays = this.roundToHalfDay(hours, workDayHours);
      const amount = roundedDays * rate;
      this.invoiceForm.patchValue({
        totalDays: roundedDays,
        amount: Math.round(amount * 100) / 100,
        subtotal: Math.round(amount * 100) / 100,
      }, { emitEvent: false });
    }
  }

  aggregateTime(): void {
    const projectId = this.invoiceForm.get('projectId')?.value;
    const startDate = this.invoiceForm.get('startDate')?.value;
    const endDate = this.invoiceForm.get('endDate')?.value;

    if (!projectId || !startDate || !endDate) {
      this.error.set('Please select project and date range');
      return;
    }

    const rateType = this.billingType;
    const rate = rateType === 'hourly' 
      ? this.invoiceForm.get('hourlyRate')?.value || 0 
      : this.invoiceForm.get('dailyRate')?.value || 0;

    if (!rate) {
      this.error.set('Please enter a rate');
      return;
    }

    this.aggregatingTime.set(true);
    this.error.set('');

    this.invoiceStore.aggregateTime({
      projectId,
      startDate: new Date(startDate).toISOString(),
      endDate: new Date(endDate).toISOString(),
      rateType: rateType as 'hourly' | 'daily',
      rate,
    }).subscribe({
      next: (result: TimeAggregationResult) => {
        let roundedHours = result.totalHours;
        let roundedDays = result.totalDays;
        let amount = result.amount;

        if (rateType === 'hourly') {
          roundedHours = this.roundToHalfHour(result.totalHours);
          amount = roundedHours * rate;
        } else {
          const workDayHours = this.invoiceForm.get('workDayHours')?.value || 8;
          roundedDays = this.roundToHalfDay(result.totalHours, workDayHours);
          amount = roundedDays * rate;
        }

        this.invoiceForm.patchValue({
          totalHours: roundedHours,
          totalDays: roundedDays,
          amount: Math.round(amount * 100) / 100,
          subtotal: Math.round(amount * 100) / 100,
        });
        this.aggregatingTime.set(false);
      },
      error: (err: unknown) => {
        const error = err as { error?: { message?: string } };
        this.error.set(error.error?.message || 'Failed to aggregate time');
        this.aggregatingTime.set(false);
      },
    });
  }

  onSubmit(): void {
    if (this.invoiceForm.invalid) {
      this.invoiceForm.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    this.error.set('');

    const formValue = this.invoiceForm.value;

    const payload: CreateInvoicePayload = {
      projectId: formValue.projectId,
      clientId: '',
      clientName: formValue.clientName,
      clientEmail: formValue.clientEmail,
      billingType: formValue.billingType,
      subtotal: formValue.subtotal,
      amount: formValue.amount,
      tax: formValue.tax || 0,
      dueDate: formValue.dueDate ? new Date(formValue.dueDate).toISOString() : undefined,
      notes: formValue.notes || undefined,
    };

    if (formValue.billingType === 'hourly' || formValue.billingType === 'daily') {
      payload.hourlyRate = formValue.hourlyRate;
      payload.dailyRate = formValue.dailyRate;
      payload.totalHours = formValue.totalHours;
      payload.totalDays = formValue.totalDays;
      if (formValue.startDate && formValue.endDate) {
        payload.dateRange = {
          startDate: new Date(formValue.startDate).toISOString(),
          endDate: new Date(formValue.endDate).toISOString(),
        };
      }
      if (this.timeInputMode() === 'manual') {
        payload.manualHours = formValue.manualHours;
        payload.manualDays = formValue.manualDays;
      }
    }

    if (formValue.billingType === 'manual' && formValue.lineItems?.length) {
      payload.lineItems = formValue.lineItems;
    }

    if (formValue.paymentStages?.length) {
      payload.paymentStages = formValue.paymentStages.map((stage: any) => ({
        ...stage,
        dueDate: stage.dueDate ? new Date(stage.dueDate).toISOString() : undefined,
      }));
    }

    if (formValue.expenses?.length) {
      payload.expenses = formValue.expenses.map((expense: any) => ({
        ...expense,
        date: expense.date ? new Date(expense.date).toISOString() : undefined,
      }));
    }

    if (this.mode() === 'create') {
      this.invoiceStore.createInvoice(payload).subscribe({
        next: () => {
          this.saving.set(false);
          this.router.navigate(['/invoices']);
        },
        error: (err: unknown) => {
          const error = err as { error?: { message?: string } };
          this.error.set(error.error?.message || 'Failed to create invoice');
          this.saving.set(false);
        },
      });
    } else {
      const id = this.invoiceId();
      this.invoiceStore.updateInvoice(id, payload).subscribe({
        next: () => {
          this.saving.set(false);
          this.router.navigate(['/invoices']);
        },
        error: (err: unknown) => {
          const error = err as { error?: { message?: string } };
          this.error.set(error.error?.message || 'Failed to update invoice');
          this.saving.set(false);
        },
      });
    }
  }
}
