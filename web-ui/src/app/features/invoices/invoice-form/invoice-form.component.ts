import { Component, signal, inject, OnInit, ChangeDetectionStrategy, DestroyRef, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormArray } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faArrowLeft, faSpinner, faSave, faPlus, faTrash, faClock, faCheckSquare, faSquare } from '@fortawesome/free-solid-svg-icons';
import { InvoiceStore } from '../../../stores/invoice.store';
import { ProjectStore } from '../../../stores/project.store';
import { TaskStore } from '../../../stores/task.store';
import { ContentStore } from '../../../stores/content.store';
import { Project } from '../../../shared/models/project.model';
import { Task } from '../../../shared/models/task.model';
import { Invoice, InvoiceLineItem, InvoiceExpense } from '../../../shared/models/invoice.model';
import { extractId, InvoiceFormValue } from './invoice-form.types';
import { InvoiceFormBuilderService, InvoiceFormControls } from '../services/invoice-form-builder.service';
import { InvoiceFormCalculationsService } from '../services/invoice-form-calculations.service';
import { TimeEntryManagerService } from '../services/time-entry-manager.service';
import { InvoicePayloadBuilderService } from '../services/invoice-payload-builder.service';
import { InvoiceSubmissionService } from '../services/invoice-submission.service';

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
  readonly contentStore = inject(ContentStore);
  private readonly destroyRef = inject(DestroyRef);

  private readonly formBuilder = inject(InvoiceFormBuilderService);
  private readonly calculations = inject(InvoiceFormCalculationsService);
  private readonly timeManager = inject(TimeEntryManagerService);
  private readonly payloadBuilder = inject(InvoicePayloadBuilderService);
  private readonly submission = inject(InvoiceSubmissionService);

  readonly invoiceForm = this.formBuilder.createForm();

  readonly mode = signal<'create' | 'edit'>('create');
  readonly loading = signal(false);
  readonly error = signal('');
  readonly invoiceId = signal('');
  readonly projects = signal<Project[]>([]);
  readonly tasks = signal<Task[]>([]);

  readonly faArrowLeft = faArrowLeft;
  readonly faSpinner = faSpinner;
  readonly faSave = faSave;
  readonly faPlus = faPlus;
  readonly faTrash = faTrash;
  readonly faClock = faClock;
  readonly faCheckSquare = faCheckSquare;
  readonly faSquare = faSquare;

  get lineItems(): FormArray {
    return this.invoiceForm.controls.lineItems;
  }

  get expenses(): FormArray {
    return this.invoiceForm.controls.expenses;
  }

  get billingType(): string {
    return this.invoiceForm.controls.billingType.value;
  }

  readonly timeInputMode = computed(() => this.timeManager.timeInputMode());
  readonly timeEntries = computed(() => this.timeManager.timeEntries());
  readonly selectedEntryIds = computed(() => this.timeManager.selectedEntryIds());
  readonly loadingTimeEntries = computed(() => this.timeManager.loadingTimeEntries());
  readonly calculationResult = computed(() => this.timeManager.calculationResult());
  readonly calculationDetails = computed(() => this.timeManager.calculationDetails());
  readonly aggregatingTime = computed(() => this.timeManager.aggregatingTime());

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
    return this.invoiceForm.controls.subtotal.value;
  }

  get tax(): number {
    return this.invoiceForm.controls.tax.value;
  }

  get total(): number {
    return this.subtotal + this.tax;
  }

  get billableAmount(): number {
    return this.calculations.calculateBillableAmount(this.invoiceForm, this.billingType);
  }

  get overtimeRateValue(): number {
    return this.invoiceForm.controls.overtimeRate.value;
  }

  get overtimeAmount(): number {
    const result = this.calculationResult();
    if (!result || result.totalOvertimeHours <= 0) return 0;
    return this.calculations.calculateOvertimeAmount(this.invoiceForm, this.billingType, result.totalOvertimeHours);
  }

  get effectiveOvertimeRate(): number {
    return this.calculations.getHourlyOvertimeRate(this.invoiceForm, this.billingType);
  }

  get effectiveOvertimeHours(): number {
    const result = this.calculationResult();
    if (!result) return 0;
    return this.calculations.getEffectiveOvertimeHours(this.invoiceForm, result.totalOvertimeHours);
  }

  get lineItemSubtotal(): number {
    if (this.billingType === 'manual') {
      return this.lineItems.controls.reduce(
        (sum, control) => sum + (control.get('amount')?.value || 0), 0
      );
    }
    return 0;
  }

  get expensesTotal(): number {
    return this.expenses.controls.reduce(
      (sum, control) => sum + (control.get('amount')?.value || 0), 0
    );
  }

  get showSummaryBreakdown(): boolean {
    return this.billingType !== 'manual';
  }

  get allSelected(): boolean {
    return this.timeManager.allSelected;
  }

  get selectedCount(): number {
    return this.timeManager.selectedCount;
  }

  get availableOvertimeHours(): number {
    return this.timeManager.availableOvertimeHours;
  }

  get overtimeExceedsAvailable(): boolean {
    const overtimeHours = this.invoiceForm.controls.overtimeHours.value;
    return overtimeHours > this.availableOvertimeHours && this.availableOvertimeHours >= 0;
  }

  readonly saving = computed(() => this.submission.saving());

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    this.loadInitialData(id);
    this.setupFormSubscriptions();
  }

  private loadInitialData(id: string | null): void {
    this.projectStore.loadAllProjects().subscribe({
      next: (response) => {
        this.projects.set(response.data);
        if (id) {
          this.loadInvoiceData(id);
        } else {
          this.mode.set('create');
          if (this.invoiceForm.controls.billingType.value === 'manual') {
            this.addLineItem();
          }
        }
      },
      error: (err) => console.error('Failed to load projects:', err),
    });
  }

  private setupFormSubscriptions(): void {
    this.formBuilder.setupFormSubscriptions(
      this.invoiceForm,
      {
        onProjectChange: (projectId: string) => this.onProjectChange(projectId),
        onBillingTypeChange: (billingType: string) => this.onBillingTypeChange(billingType),
        onManualTimeChange: () => this.calculateManualAmount(),
        onRateChange: () => this.onRateChange(),
        onOvertimeChange: () => this.calculateSelectedEntriesAmount(),
      },
      this.destroyRef
    );
  }

  private onProjectChange(projectId: string): void {
    if (projectId) {
      const project = this.projects().find((p) => p._id === projectId);
      if (project) {
        this.formBuilder.populateFromProject(this.invoiceForm, project);
      }
      this.loadTasksForProject(projectId);
      this.timeManager.loadTimeEntries(projectId);
    } else {
      this.tasks.set([]);
      this.timeManager.clearSelection();
      this.invoiceForm.controls.taskId.setValue('');
    }
  }

  private onBillingTypeChange(billingType: string): void {
    if (billingType !== 'manual') {
      this.formBuilder.clearArray(this.lineItems);
    } else if (this.lineItems.length === 0) {
      this.addLineItem();
    }
    if (billingType === 'hourly' || billingType === 'daily') {
      this.timeManager.timeInputMode.set('fetch');
    }
  }

  private onRateChange(): void {
    if (this.timeInputMode() === 'manual' && this.billingType === 'hourly' || this.billingType === 'daily') {
      this.calculateManualAmount();
    }
    this.calculateSelectedEntriesAmount();
  }

  loadInvoiceData(id: string): void {
    this.mode.set('edit');
    this.invoiceId.set(id);
    this.loading.set(true);

    this.invoiceStore.loadInvoice(id).subscribe({
      next: (invoice: Invoice) => {
        const projectId = extractId(invoice.projectId) || '';
        const taskId = extractId(invoice.taskId);

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
          overtimeHours: invoice.overtimeHours || 0,
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
          this.timeManager.selectedEntryIds.set(new Set(invoice.timeEntryIds));
        }

        this.loading.set(false);
      },
      error: () => {
        this.error.set(this.contentStore.content('invoice.form.error.loadFailed'));
        this.loading.set(false);
      },
    });
  }

  loadTasksForProject(projectId: string): void {
    if (!projectId) {
      this.tasks.set([]);
      this.invoiceForm.controls.taskId.setValue('');
      return;
    }
    this.taskStore.loadTasksByProject(projectId).subscribe({
      next: (tasks: Task[]) => {
        this.tasks.set(tasks.filter((t) => t.status === 'done'));
      },
      error: (err) => console.error('Failed to load tasks:', err),
    });
  }

  toggleEntry(entryId: string): void {
    this.timeManager.toggleEntry(entryId);
  }

  toggleSelectAll(): void {
    this.timeManager.toggleSelectAll();
  }

  isEntrySelected(entryId: string): boolean {
    return this.timeManager.isEntrySelected(entryId);
  }

  getEntryDetail(entryId: string) {
    return this.timeManager.getEntryDetail(entryId);
  }

  addLineItem(item?: InvoiceLineItem): void {
    this.formBuilder.addLineItem(this.lineItems, item);
    this.updateLineItemAmounts();
  }

  removeLineItem(index: number): void {
    this.lineItems.removeAt(index);
    this.updateLineItemAmounts();
  }

  addExpense(expense?: InvoiceExpense): void {
    this.formBuilder.addExpense(this.expenses, expense);
    this.updateExpenseTotals();
  }

  removeExpense(index: number): void {
    this.expenses.removeAt(index);
    this.updateExpenseTotals();
  }

  clearExpenses(): void {
    this.formBuilder.clearArray(this.expenses);
    this.updateExpenseTotals();
  }

  updateLineItemAmounts(): void {
    this.formBuilder.updateLineItemAmounts(this.lineItems, this.billingType, (total) => {
      this.invoiceForm.controls.subtotal.setValue(total, { emitEvent: false });
    });
  }

  updateExpenseTotals(): void {
    const baseAmount = this.invoiceForm.controls.amount.value;
    this.formBuilder.updateExpenseTotals(this.expenses, baseAmount, (total) => {
      this.invoiceForm.controls.subtotal.setValue(total, { emitEvent: false });
    });
  }

  onLineItemChange(): void {
    this.updateLineItemAmounts();
  }

  onTimeInputModeChange(mode: 'fetch' | 'manual'): void {
    this.timeManager.timeInputMode.set(mode);
    if (mode === 'manual') {
      this.invoiceForm.patchValue({
        totalHours: 0,
        totalDays: 0,
        amount: 0,
        subtotal: 0,
      });
    }
  }

  calculateManualAmount(): void {
    this.calculations.calculateManualAmount(this.invoiceForm, this.billingType);
  }

  calculateSelectedEntriesAmount(): void {
    this.calculations.calculateSelectedEntriesAmount(
      this.invoiceForm,
      this.billingType,
      this.calculationResult()
    );
  }

  calculateSelectedEntries(): void {
    const rate = this.calculations.getRateForBillingType(this.invoiceForm, this.billingType);
    const workDayHours = this.invoiceForm.controls.workDayHours.value;
    const overtimeRate = this.invoiceForm.controls.overtimeRate.value;

    this.timeManager.calculateSelectedEntries(
      this.billingType as 'hourly' | 'daily',
      rate,
      workDayHours,
      overtimeRate,
      (result) => {
        if (this.billingType === 'hourly') {
          this.invoiceForm.patchValue({
            totalHours: result.totalBillableHours + result.totalOvertimeHours,
            amount: result.amount,
            subtotal: result.amount,
          });
        } else {
          const dailyRate = this.invoiceForm.controls.dailyRate.value;
          const baseAmount = result.totalDays * dailyRate;
          this.invoiceForm.patchValue({
            totalDays: result.totalDays,
            amount: Math.round(baseAmount * 100) / 100,
            subtotal: Math.round(baseAmount * 100) / 100,
          });
        }
      }
    );
  }

  aggregateTime(): void {
    const projectId = this.invoiceForm.controls.projectId.value;
    const startDate = this.invoiceForm.controls.startDate.value;
    const endDate = this.invoiceForm.controls.endDate.value;
    const rate = this.calculations.getRateForBillingType(this.invoiceForm, this.billingType);

    this.timeManager.aggregateTime(
      projectId,
      startDate,
      endDate,
      this.billingType as 'hourly' | 'daily',
      rate,
      (result) => {
        let roundedHours = result.totalHours;
        let roundedDays = result.totalDays;
        let amount = result.amount;

        if (this.billingType === 'hourly') {
          roundedHours = this.calculations.roundToHalfHour(result.totalHours);
          amount = roundedHours * rate;
        } else {
          const workDayHours = this.invoiceForm.controls.workDayHours.value;
          roundedDays = this.calculations.roundToHalfDay(result.totalHours, workDayHours);
          amount = roundedDays * rate;
        }

        this.invoiceForm.patchValue({
          totalHours: roundedHours,
          totalDays: roundedDays,
          amount: Math.round(amount * 100) / 100,
          subtotal: Math.round(amount * 100) / 100,
        });
      }
    );
  }

  onSubmit(): void {
    if (this.invoiceForm.invalid) {
      this.invoiceForm.markAllAsTouched();
      return;
    }

    const formValue = this.invoiceForm.value as InvoiceFormValue;
    const project = this.projects().find((p) => p._id === formValue.projectId);
    const selectedIds = Array.from(this.timeManager.selectedEntryIds());
    const timeInputMode = this.timeManager.timeInputMode();

    if (this.mode() === 'create') {
      const payload = this.payloadBuilder.buildCreatePayload(formValue, project, selectedIds, timeInputMode);
      this.submission.handleSubmission(
        () => this.invoiceStore.createInvoice(payload),
        'invoice.form.error.createFailed'
      );
    } else {
      const id = this.invoiceId();
      const payload = this.payloadBuilder.buildUpdatePayload(formValue, project, selectedIds, timeInputMode);
      this.submission.handleSubmission(
        () => this.invoiceStore.updateInvoice(id, payload),
        'invoice.form.error.updateFailed'
      );
    }
  }

  formatDuration(seconds: number): string {
    return this.calculations.formatDuration(seconds);
  }

  formatDate(date: Date | string): string {
    return this.calculations.formatDate(date);
  }
}
