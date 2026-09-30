import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter, ActivatedRoute } from '@angular/router';
import { ReactiveFormsModule } from '@angular/forms';
import { InvoiceFormComponent } from './invoice-form.component';
import { InvoiceStore } from '../../../stores/invoice.store';
import { ProjectStore } from '../../../stores/project.store';
import { TaskStore } from '../../../stores/task.store';
import { ContentStore } from '../../../stores/content.store';
import { ToastService } from '../../../core/services/toast.service';
import { of, Subject } from 'rxjs';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Task } from '../../../shared/models/task.model';

const mockContentStore = {
  content: vi.fn((key: string) => key),
};

const mockInvoiceStore = {
  loadInvoice: vi.fn(() => of({})),
  createInvoice: vi.fn(() => of({})),
  updateInvoice: vi.fn(() => of({})),
  aggregateTime: vi.fn(() => of({ totalHours: 10, totalDays: 1.25, amount: 1000, timeEntryIds: [] })),
};

const mockProjectStore = {
  loadAllProjects: vi.fn(() => of({ data: [] })),
};

const mockTaskStore = {
  loadTasksByProject: vi.fn(() => of<Task[]>([])),
};

const mockToastService = {
  success: vi.fn(),
  error: vi.fn(),
  info: vi.fn(),
  warning: vi.fn(),
};

const mockActivatedRoute = {
  snapshot: { paramMap: { get: vi.fn(() => null) } },
};

function createMockTask(overrides: Partial<Task> = {}): Task {
  return {
    _id: 'task-1',
    title: 'Test Task',
    status: 'done',
    priority: 'medium',
    projectId: 'proj-1',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

describe('InvoiceFormComponent', () => {
  let component: InvoiceFormComponent;
  let fixture: ComponentFixture<InvoiceFormComponent>;

  beforeEach(async () => {
    vi.clearAllMocks();

    await TestBed.configureTestingModule({
      imports: [InvoiceFormComponent],
      schemas: [NO_ERRORS_SCHEMA],
      providers: [
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: InvoiceStore, useValue: mockInvoiceStore },
        { provide: ProjectStore, useValue: mockProjectStore },
        { provide: TaskStore, useValue: mockTaskStore },
        { provide: ContentStore, useValue: mockContentStore },
        { provide: ToastService, useValue: mockToastService },
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(InvoiceFormComponent);
    component = fixture.componentInstance;
    component.ngOnInit();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize in create mode', () => {
    expect(component.mode()).toBe('create');
  });

  it('should have billing type default to budget', () => {
    expect(component.invoiceForm.controls.billingType.value).toBe('budget');
  });

  it('should have required validators on projectId', () => {
    const control = component.invoiceForm.controls.projectId;
    control.setValue('');
    expect(control.hasError('required')).toBe(true);
  });

  it('should have required validators on clientName', () => {
    const control = component.invoiceForm.controls.clientName;
    control.setValue('');
    expect(control.hasError('required')).toBe(true);
  });

  it('should have email validator on clientEmail', () => {
    const control = component.invoiceForm.controls.clientEmail;
    control.setValue('invalid');
    expect(control.hasError('email')).toBe(true);
  });

  it('should show line items section when billing type is manual', () => {
    component.invoiceForm.controls.billingType.setValue('manual');
    expect(component.showLineItems).toBe(true);
  });

  it('should hide line items section when billing type is not manual', () => {
    component.invoiceForm.controls.billingType.setValue('budget');
    expect(component.showLineItems).toBe(false);
  });

  it('should show time section when billing type is hourly', () => {
    component.invoiceForm.controls.billingType.setValue('hourly');
    expect(component.showTimeSection).toBe(true);
  });

  it('should show time section when billing type is daily', () => {
    component.invoiceForm.controls.billingType.setValue('daily');
    expect(component.showTimeSection).toBe(true);
  });

  it('should hide time section when billing type is budget', () => {
    component.invoiceForm.controls.billingType.setValue('budget');
    expect(component.showTimeSection).toBe(false);
  });

  it('should default time input mode to fetch', () => {
    expect(component.timeInputMode()).toBe('fetch');
  });

  it('should switch time input mode to manual', () => {
    component.onTimeInputModeChange('manual');
    expect(component.timeInputMode()).toBe('manual');
  });

  it('should add a line item', () => {
    component.invoiceForm.controls.billingType.setValue('manual');
    const initialLength = component.lineItems.length;
    component.addLineItem();
    expect(component.lineItems.length).toBe(initialLength + 1);
  });

  it('should remove a line item', () => {
    component.invoiceForm.controls.billingType.setValue('manual');
    component.addLineItem();
    const length = component.lineItems.length;
    component.removeLineItem(0);
    expect(component.lineItems.length).toBe(length - 1);
  });

  it('should clear line items', () => {
    component.invoiceForm.controls.billingType.setValue('manual');
    component.addLineItem();
    component.addLineItem();
    component.clearLineItems();
    expect(component.lineItems.length).toBe(0);
  });

  it('should add an expense', () => {
    const initialLength = component.expenses.length;
    component.addExpense();
    expect(component.expenses.length).toBe(initialLength + 1);
  });

  it('should remove an expense', () => {
    component.addExpense();
    const length = component.expenses.length;
    component.removeExpense(0);
    expect(component.expenses.length).toBe(length - 1);
  });

  it('should clear expenses', () => {
    component.addExpense();
    component.addExpense();
    component.clearExpenses();
    expect(component.expenses.length).toBe(0);
  });

  it('should calculate manual amount for hourly billing', () => {
    component.invoiceForm.controls.billingType.setValue('hourly');
    component.invoiceForm.controls.manualHours.setValue(5);
    component.invoiceForm.controls.hourlyRate.setValue(100);
    component.calculateManualAmount();
    expect(component.invoiceForm.controls.amount.value).toBe(500);
  });

  it('should calculate manual amount for daily billing', () => {
    component.invoiceForm.controls.billingType.setValue('daily');
    component.invoiceForm.controls.manualHours.setValue(11);
    component.invoiceForm.controls.workDayHours.setValue(8);
    component.invoiceForm.controls.dailyRate.setValue(500);
    component.calculateManualAmount();
    expect(component.invoiceForm.controls.amount.value).toBe(750);
  });

  it('should load tasks for project', () => {
    const mockTasks = [createMockTask()];
    mockTaskStore.loadTasksByProject.mockReturnValue(of(mockTasks));

    component.loadTasksForProject('proj-1');

    expect(mockTaskStore.loadTasksByProject).toHaveBeenCalledWith('proj-1');
    expect(component.tasks()).toHaveLength(1);
  });

  it('should filter tasks to only done status', () => {
    const mockTasks = [
      createMockTask({ _id: 'task-1', status: 'done' }),
      createMockTask({ _id: 'task-2', status: 'in_progress' }),
    ];
    mockTaskStore.loadTasksByProject.mockReturnValue(of(mockTasks));

    component.loadTasksForProject('proj-1');

    expect(component.tasks()).toHaveLength(1);
    expect(component.tasks()[0].status).toBe('done');
  });

  it('should clear tasks when project id is empty', () => {
    component.tasks.set([createMockTask()]);
    component.loadTasksForProject('');
    expect(component.tasks()).toEqual([]);
  });

  it('should clear line items when switching away from manual billing', () => {
    component.invoiceForm.controls.billingType.setValue('manual');
    component.addLineItem();
    expect(component.lineItems.length).toBeGreaterThan(0);

    component.invoiceForm.controls.billingType.setValue('budget');
    expect(component.lineItems.length).toBe(0);
  });
});
