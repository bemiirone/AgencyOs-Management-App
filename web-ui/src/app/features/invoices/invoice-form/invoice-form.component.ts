import { Component, signal, inject, OnInit, ChangeDetectionStrategy, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faArrowLeft, faSpinner, faSave, faPlus, faTrash, faClock, faCheckSquare, faSquare } from '@fortawesome/free-solid-svg-icons';
import { InvoiceStore } from '../../../stores/invoice.store';
import { CreateInvoicePayload, UpdateInvoicePayload, TimeCalculationResult } from '../../../stores/invoice.types';
import { ProjectStore } from '../../../stores/project.store';
import { TaskStore } from '../../../stores/task.store';
import { ContentStore } from '../../../stores/content.store';
import { Project } from '../../../shared/models/project.model';
import { Task } from '../../../shared/models/task.model';
import { TimeEntry } from '../../../shared/models/time-entry.model';
import { Invoice, InvoiceLineItem, InvoiceExpense, TimeEntryCalculationDetail } from '../../../shared/models/invoice.model';

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
  private readonly taskStore = inject(TaskStore);
  private readonly fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);
  readonly contentStore = inject(ContentStore);

  readonly mode = signal<'create' | 'edit'>('create');
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly error = signal('');
  readonly invoiceId = signal('');
  readonly projects = signal<Project[]>([]);
  readonly tasks = signal<Task[]>([]);
  readonly aggregatingTime = signal(false);
  readonly timeInputMode = signal<'fetch' | 'manual'>('fetch');
  readonly timeEntries = signal<TimeEntry[]>([]);
  readonly selectedEntryIds = signal<Set<string>>(new Set());
  readonly loadingTimeEntries = signal(false);
  readonly calculationResult = signal<TimeCalculationResult | null>(null);
  readonly calculationDetails = signal<TimeEntryCalculationDetail[]>([]);

  readonly faArrowLeft = faArrowLeft;
  readonly faSpinner = faSpinner;
  readonly faSave = faSave;
  readonly faPlus = faPlus;
  readonly faTrash = faTrash;
  readonly faClock = faClock;
  readonly faCheckSquare = faCheckSquare;
  readonly faSquare = faSquare;

  invoiceForm: FormGroup = this.fb.group({
    projectId: ['', Validators.required],
    taskId: [''],
    clientName: ['', Validators.required],
    clientEmail: ['', [Validators.required, Validators.email]],
    billingType: ['budget', Validators.required],
    lineItems: this.fb.array([]),
    expenses: this.fb.array([]),
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

  get lineItems(): FormArray {
    return this.invoiceForm.get('lineItems') as FormArray;
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

  get subtotal(): number {
    return this.invoiceForm.get('subtotal')?.value || 0;
  }

  get tax(): number {
    return this.invoiceForm.get('tax')?.value || 0;
  }

  get total(): number {
    return this.subtotal + this.tax;
  }

  get allSelected(): boolean {
    const entries = this.timeEntries();
    if (entries.length === 0) return false;
    return this.selectedEntryIds().size === entries.length;
  }

  get selectedCount(): number {
    return this.selectedEntryIds().size;
  }

  get availableOvertimeHours(): number {
    return this.calculationResult()?.totalOvertimeHours || 0;
  }

  get overtimeExceedsAvailable(): boolean {
    const overtimeHours = this.invoiceForm.get('overtimeHours')?.value || 0;
    return overtimeHours > this.availableOvertimeHours && this.availableOvertimeHours >= 0;
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    this.loadInitialData(id);
    this.setupFormSubscriptions();
  }

  loadInvoiceData(id: string): void {
    this.mode.set('edit');
    this.invoiceId.set(id);
    this.loading.set(true);

    this.invoiceStore.loadInvoice(id).subscribe({
      next: (invoice: Invoice) => {
        const projectId = typeof invoice.projectId === 'string' ? invoice.projectId : (invoice.projectId as any)?._id;
        const taskId = typeof invoice.taskId === 'string' ? invoice.taskId : (invoice.taskId as any)?._id;

        this.invoiceForm.patchValue({
          projectId: projectId || '',
          clientName: invoice.clientName,
          clientEmail: invoice.clientEmail,
          billingType: invoice.billingType,
          hourlyRate: invoice.hourlyRate || 0,
          dailyRate: invoice.dailyRate || 0,
          totalHours: invoice.totalHours || 0,
          totalDays: invoice.totalDays || 0,
          workDayHours: invoice.workDayHours || 8,
          overtimeRate: invoice.overtimeRate || 1.5,
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

        if (taskId) {
          this.invoiceForm.patchValue({ taskId });
          if (projectId) {
            this.loadTasksForProject(projectId);
          }
        }

        if (invoice.expenses?.length) {
          invoice.expenses.forEach((expense) => this.addExpense(expense));
        }

        if (invoice.timeEntryIds?.length) {
          this.selectedEntryIds.set(new Set(invoice.timeEntryIds));
        }

        this.loading.set(false);
      },
      error: () => {
        this.error.set(this.contentStore.content('invoice.form.error.loadFailed'));
        this.loading.set(false);
      },
    });
  }

  private loadInitialData(id: string | null): void {
    this.projectStore.loadAllProjects().subscribe({
      next: (response) => {
        this.projects.set(response.data);

        if (id) {
          this.loadInvoiceData(id);
        } else {
          this.mode.set('create');
          if (this.invoiceForm.get('billingType')?.value === 'manual') {
            this.addLineItem();
          }
        }
      },
      error: (err) => console.error('Failed to load projects:', err),
    });
  }

  private setupFormSubscriptions(): void {
    this.invoiceForm.get('projectId')?.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((projectId: string) => {
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
          this.loadTasksForProject(projectId);
          this.loadTimeEntriesForProject(projectId);
        } else {
          this.tasks.set([]);
          this.timeEntries.set([]);
          this.selectedEntryIds.set(new Set());
          this.invoiceForm.get('taskId')?.setValue('');
        }
      });

    this.invoiceForm.get('billingType')?.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((billingType) => {
        if (billingType !== 'manual') {
          this.clearLineItems();
        } else if (this.lineItems.length === 0) {
          this.addLineItem();
        }
        if (billingType === 'hourly' || billingType === 'daily') {
          this.timeInputMode.set('fetch');
        }
      });

    this.invoiceForm.get('manualHours')?.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.calculateManualAmount());

    this.invoiceForm.get('manualDays')?.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.calculateManualAmount());

    this.invoiceForm.get('hourlyRate')?.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        if (this.timeInputMode() === 'manual' && this.billingType === 'hourly') {
          this.calculateManualAmount();
        }
      });

    this.invoiceForm.get('dailyRate')?.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        if (this.timeInputMode() === 'manual' && this.billingType === 'daily') {
          this.calculateManualAmount();
        }
      });

    this.invoiceForm.get('overtimeHours')?.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.calculateSelectedEntriesAmount());

    this.invoiceForm.get('overtimeRate')?.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.calculateSelectedEntriesAmount());
  }

  loadTimeEntriesForProject(projectId: string): void {
    if (!projectId) {
      this.timeEntries.set([]);
      this.selectedEntryIds.set(new Set());
      this.calculationResult.set(null);
      this.calculationDetails.set([]);
      return;
    }

    this.loadingTimeEntries.set(true);
    this.invoiceStore.loadTimeEntriesForProject(projectId).subscribe({
      next: (entries: TimeEntry[]) => {
        this.timeEntries.set(entries);
        this.loadingTimeEntries.set(false);
      },
      error: () => {
        this.loadingTimeEntries.set(false);
      },
    });
  }

  toggleEntry(entryId: string): void {
    const current = new Set(this.selectedEntryIds());
    if (current.has(entryId)) {
      current.delete(entryId);
    } else {
      current.add(entryId);
    }
    this.selectedEntryIds.set(current);
  }

  toggleSelectAll(): void {
    if (this.allSelected) {
      this.selectedEntryIds.set(new Set());
    } else {
      this.selectedEntryIds.set(new Set(this.timeEntries().map((e) => e._id)));
    }
  }

  isEntrySelected(entryId: string): boolean {
    return this.selectedEntryIds().has(entryId);
  }

  getEntryDetail(entryId: string): TimeEntryCalculationDetail | undefined {
    return this.calculationDetails().find((d) => d.timeEntryId === entryId);
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

  clearLineItems(): void {
    while (this.lineItems.length) {
      this.lineItems.removeAt(0);
    }
    this.updateLineItemAmounts();
  }

  loadTasksForProject(projectId: string): void {
    if (!projectId) {
      this.tasks.set([]);
      this.invoiceForm.get('taskId')?.setValue('');
      return;
    }
    this.taskStore.loadTasksByProject(projectId).subscribe({
      next: (tasks: Task[]) => {
        this.tasks.set(tasks.filter((t) => t.status === 'done'));
      },
      error: (err) => console.error('Failed to load tasks:', err),
    });
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

  calculateSelectedEntries(): void {
    const selectedIds = Array.from(this.selectedEntryIds());
    if (selectedIds.length === 0) {
      this.error.set(this.contentStore.content('invoice.form.error.selectEntries'));
      return;
    }

    const rateType = this.billingType;
    const rate = rateType === 'hourly'
      ? this.invoiceForm.get('hourlyRate')?.value || 0
      : this.invoiceForm.get('dailyRate')?.value || 0;

    if (!rate) {
      this.error.set(this.contentStore.content('invoice.form.error.enterRate'));
      return;
    }

    this.aggregatingTime.set(true);
    this.error.set('');
    this.invoiceForm.get('overtimeHours')?.setValue(0, { emitEvent: false });

    this.invoiceStore.calculateTimeEntries({
      timeEntryIds: selectedIds,
      rateType: rateType as 'hourly' | 'daily',
      hourlyRate: rateType === 'hourly' ? rate : undefined,
      dailyRate: rateType === 'daily' ? rate : undefined,
      calculationOptions: {
        workDayHours: this.invoiceForm.get('workDayHours')?.value || 8,
        overtimeRate: this.invoiceForm.get('overtimeRate')?.value || 1.5,
      },
    }).subscribe({
      next: (result: TimeCalculationResult) => {
        this.calculationResult.set(result);
        this.calculationDetails.set(result.entries);

        if (rateType === 'hourly') {
          this.invoiceForm.patchValue({
            totalHours: result.totalBillableHours + result.totalOvertimeHours,
            amount: result.amount,
            subtotal: result.amount,
          });
        } else {
          const dailyRate = this.invoiceForm.get('dailyRate')?.value || 0;
          const baseAmount = result.totalDays * dailyRate;
          this.invoiceForm.patchValue({
            totalDays: result.totalDays,
            amount: Math.round(baseAmount * 100) / 100,
            subtotal: Math.round(baseAmount * 100) / 100,
          });
        }

        this.aggregatingTime.set(false);
      },
      error: (err: unknown) => {
        const error = err as { error?: { message?: string } };
        this.error.set(error.error?.message || 'Failed to calculate time entries');
        this.aggregatingTime.set(false);
      },
    });
  }

  calculateSelectedEntriesAmount(): void {
    if (this.billingType !== 'daily' || !this.calculationResult()) {
      return;
    }

    const result = this.calculationResult()!;
    const dailyRate = this.invoiceForm.get('dailyRate')?.value || 0;
    const overtimeHours = this.invoiceForm.get('overtimeHours')?.value || 0;
    const workDayHours = this.invoiceForm.get('workDayHours')?.value || 8;
    const overtimeRateMultiplier = this.invoiceForm.get('overtimeRate')?.value || 1.5;

    const cappedOvertimeHours = Math.min(overtimeHours, result.totalOvertimeHours);
    const hourlyBaseRate = workDayHours > 0 ? dailyRate / workDayHours : 0;
    const baseAmount = result.totalDays * dailyRate;
    const overtimeAmount = cappedOvertimeHours * hourlyBaseRate * overtimeRateMultiplier;
    const totalAmount = baseAmount + overtimeAmount;

    this.invoiceForm.patchValue({
      totalDays: result.totalDays,
      amount: Math.round(totalAmount * 100) / 100,
      subtotal: Math.round(totalAmount * 100) / 100,
    }, { emitEvent: false });
  }

  aggregateTime(): void {
    const projectId = this.invoiceForm.get('projectId')?.value;
    const startDate = this.invoiceForm.get('startDate')?.value;
    const endDate = this.invoiceForm.get('endDate')?.value;

    if (!projectId || !startDate || !endDate) {
      this.error.set(this.contentStore.content('invoice.form.error.selectProjectDate'));
      return;
    }

    const rateType = this.billingType;
    const rate = rateType === 'hourly'
      ? this.invoiceForm.get('hourlyRate')?.value || 0
      : this.invoiceForm.get('dailyRate')?.value || 0;

    if (!rate) {
      this.error.set(this.contentStore.content('invoice.form.error.enterRate'));
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
      next: (result) => {
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
    const project = this.projects().find((p) => p._id === formValue.projectId);

    if (this.mode() === 'create') {
      const payload: CreateInvoicePayload = {
        projectId: formValue.projectId,
        clientName: formValue.clientName,
        clientEmail: formValue.clientEmail,
        billingType: formValue.billingType,
        subtotal: formValue.subtotal,
        amount: formValue.amount,
        tax: formValue.tax || 0,
        dueDate: formValue.dueDate ? new Date(formValue.dueDate).toISOString() : undefined,
        notes: formValue.notes || undefined,
      };

      if (project?.clientId) {
        payload.clientId = project.clientId;
      }

      if (formValue.taskId) {
        payload.taskId = formValue.taskId;
      }

      if (formValue.billingType === 'hourly' || formValue.billingType === 'daily') {
        payload.hourlyRate = formValue.hourlyRate;
        payload.dailyRate = formValue.dailyRate;
        payload.totalHours = formValue.totalHours;
        payload.totalDays = formValue.totalDays;
        payload.workDayHours = formValue.workDayHours;
        payload.overtimeRate = formValue.overtimeRate;
        if (formValue.startDate && formValue.endDate) {
          payload.dateRange = {
            startDate: new Date(formValue.startDate).toISOString(),
            endDate: new Date(formValue.endDate).toISOString(),
          };
        }
        if (this.selectedEntryIds().size > 0) {
          payload.timeEntryIds = Array.from(this.selectedEntryIds());
        }
        if (this.timeInputMode() === 'manual') {
          payload.manualHours = formValue.manualHours;
          payload.manualDays = formValue.manualDays;
        }
      }

      if (formValue.billingType === 'manual' && formValue.lineItems?.length) {
        payload.lineItems = formValue.lineItems;
      }

      if (formValue.expenses?.length) {
        payload.expenses = formValue.expenses.map((expense: any) => ({
          ...expense,
          date: expense.date ? new Date(expense.date).toISOString() : undefined,
        }));
      }

      this.invoiceStore.createInvoice(payload).subscribe({
        next: () => {
          this.saving.set(false);
          this.router.navigate(['/invoices']);
        },
        error: (err: unknown) => {
          const error = err as { error?: { message?: string } };
          this.error.set(error.error?.message || this.contentStore.content('invoice.form.error.createFailed'));
          this.saving.set(false);
        },
      });
    } else {
      const id = this.invoiceId();
      const payload: UpdateInvoicePayload = {
        billingType: formValue.billingType,
        subtotal: formValue.subtotal,
        amount: formValue.amount,
        tax: formValue.tax || 0,
        dueDate: formValue.dueDate ? new Date(formValue.dueDate).toISOString() : undefined,
        notes: formValue.notes || undefined,
      };

      if (project?.clientId) {
        payload.clientId = project.clientId;
      }

      if (formValue.taskId) {
        payload.taskId = formValue.taskId;
      }

      if (formValue.billingType === 'hourly' || formValue.billingType === 'daily') {
        payload.hourlyRate = formValue.hourlyRate;
        payload.dailyRate = formValue.dailyRate;
        payload.totalHours = formValue.totalHours;
        payload.totalDays = formValue.totalDays;
        payload.workDayHours = formValue.workDayHours;
        payload.overtimeRate = formValue.overtimeRate;
        if (formValue.startDate && formValue.endDate) {
          payload.dateRange = {
            startDate: new Date(formValue.startDate).toISOString(),
            endDate: new Date(formValue.endDate).toISOString(),
          };
        }
        if (this.selectedEntryIds().size > 0) {
          payload.timeEntryIds = Array.from(this.selectedEntryIds());
        }
      }

      if (formValue.billingType === 'manual' && formValue.lineItems?.length) {
        payload.lineItems = formValue.lineItems;
      }

      if (formValue.expenses?.length) {
        payload.expenses = formValue.expenses.map((expense: any) => ({
          ...expense,
          date: expense.date ? new Date(expense.date).toISOString() : undefined,
        }));
      }

      this.invoiceStore.updateInvoice(id, payload).subscribe({
        next: () => {
          this.saving.set(false);
          this.router.navigate(['/invoices']);
        },
        error: (err: unknown) => {
          const error = err as { error?: { message?: string } };
          this.error.set(error.error?.message || this.contentStore.content('invoice.form.error.updateFailed'));
          this.saving.set(false);
        },
      });
    }
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
