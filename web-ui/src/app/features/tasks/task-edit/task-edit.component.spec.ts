import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { RouterTestingModule } from '@angular/router/testing';
import { Router, ActivatedRoute } from '@angular/router';
import { TaskEditComponent } from './task-edit.component';
import { TaskStore } from '../../../stores/task.store';
import { ProjectStore } from '../../../stores/project.store';
import { UserStore } from '../../../stores/user.store';
import { AuthService } from '../../../core/services/auth.service';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { signal } from '@angular/core';
import { of } from 'rxjs';

describe('TaskEditComponent', () => {
  let component: TaskEditComponent;
  let fixture: ComponentFixture<TaskEditComponent>;
  let taskStoreMock: any;
  let projectStoreMock: any;
  let userStoreMock: any;
  let authServiceMock: any;
  let routerMock: any;
  let routeMock: any;

  const mockTask = {
    _id: 'task-1',
    title: 'Existing Task',
    description: 'Task description',
    status: 'in_progress',
    priority: 'high',
    projectId: 'project-1',
    dueDate: new Date('2024-12-31'),
    assigneeIds: ['user-2'],
    createdBy: 'user-1',
  };

  const mockProjects = [
    { _id: 'project-1', name: 'Active Project', status: 'active' as const, tenantId: 'tenant-1', ownerId: 'owner-1', createdAt: new Date(), updatedAt: new Date() },
    { _id: 'project-2', name: 'Draft Project', status: 'draft' as const, tenantId: 'tenant-1', ownerId: 'owner-1', createdAt: new Date(), updatedAt: new Date() },
    { _id: 'project-3', name: 'On Hold Project', status: 'on_hold' as const, tenantId: 'tenant-1', ownerId: 'owner-1', createdAt: new Date(), updatedAt: new Date() },
  ];

  const mockUsers = [
    { id: 'user-1', name: 'John Doe' },
    { id: 'user-2', name: 'Jane Smith' },
  ];

  beforeEach(async () => {
    taskStoreMock = {
      loadTask: vi.fn().mockReturnValue({
        subscribe: (callbacks: any) => callbacks.next(mockTask),
      }),
      updateTask: vi.fn().mockReturnValue({
        subscribe: (callbacks: any) => callbacks.next({ _id: 'task-1', title: 'Updated Task' }),
      }),
    };

    projectStoreMock = {
      loadProjects: vi.fn().mockReturnValue({
        subscribe: (callbacks: any) => callbacks.next(mockProjects),
      }),
    };

    userStoreMock = {
      users: signal(mockUsers),
      loadUsers: vi.fn(),
    };

    authServiceMock = {
      getUserId: vi.fn().mockReturnValue('user-1'),
    };

    routerMock = {
      navigate: vi.fn(),
    };

    routeMock = {
      snapshot: {
        paramMap: {
          get: vi.fn().mockReturnValue('task-1'),
        },
      },
    };

    await TestBed.configureTestingModule({
      imports: [RouterTestingModule, TaskEditComponent],
      providers: [
        provideHttpClient(),
        { provide: TaskStore, useValue: taskStoreMock },
        { provide: ProjectStore, useValue: projectStoreMock },
        { provide: UserStore, useValue: userStoreMock },
        { provide: AuthService, useValue: authServiceMock },
        { provide: ActivatedRoute, useValue: routeMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TaskEditComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  describe('Component Initialization', () => {
    it('should create the component', () => {
      expect(component).toBeTruthy();
    });

    it('should load task data on init', () => {
      expect(taskStoreMock.loadTask).toHaveBeenCalledWith('task-1');
    });

    it('should load projects on init', () => {
      expect(projectStoreMock.loadProjects).toHaveBeenCalled();
    });

    it('should populate form with task data', () => {
      expect(component.form.title).toBe('Existing Task');
      expect(component.form.description).toBe('Task description');
      expect(component.form.projectId).toBe('project-1');
      expect(component.form.status).toBe('in_progress');
      expect(component.form.priority).toBe('high');
      expect(component.form.assigneeId).toBe('user-2');
      expect(component.form.createdBy).toBe('user-1');
    });

    it('should set dataLoaded to true after loading', () => {
      expect(component.dataLoaded()).toBe(true);
    });

    it('should set loading to false after loading', () => {
      expect(component.loading()).toBe(false);
    });

    it('should handle missing task ID', () => {
      routeMock.snapshot.paramMap.get.mockReturnValue(null);
      taskStoreMock.loadTask.mockClear();
      
      TestBed.resetTestingModule();
      
      TestBed.configureTestingModule({
        imports: [RouterTestingModule, TaskEditComponent],
        providers: [
          provideHttpClient(),
          { provide: TaskStore, useValue: taskStoreMock },
          { provide: ProjectStore, useValue: projectStoreMock },
          { provide: UserStore, useValue: userStoreMock },
          { provide: AuthService, useValue: authServiceMock },
          { provide: ActivatedRoute, useValue: routeMock },
        ],
      }).compileComponents();

      const newFixture = TestBed.createComponent(TaskEditComponent);
      const newComponent = newFixture.componentInstance;
      newComponent.ngOnInit();

      expect(newComponent.loading()).toBe(false);
      expect(taskStoreMock.loadTask).not.toHaveBeenCalled();
    });

    it('should set error on load failure', () => {
      taskStoreMock.loadTask.mockReturnValue({
        subscribe: (callbacks: any) => callbacks.error({}),
      });

      TestBed.resetTestingModule();
      routeMock.snapshot.paramMap.get.mockReturnValue('task-2');

      TestBed.configureTestingModule({
        imports: [RouterTestingModule, TaskEditComponent],
        providers: [
          provideHttpClient(),
          { provide: TaskStore, useValue: taskStoreMock },
          { provide: ProjectStore, useValue: projectStoreMock },
          { provide: UserStore, useValue: userStoreMock },
          { provide: AuthService, useValue: authServiceMock },
          { provide: ActivatedRoute, useValue: routeMock },
        ],
      }).compileComponents();

      const newFixture = TestBed.createComponent(TaskEditComponent);
      newFixture.detectChanges();

      expect(newFixture.componentInstance.error()).toBe('Failed to load task');
    });
  });

  describe('Available Projects Filter', () => {
    it('should only include active and draft projects', () => {
      component.projects.set(mockProjects);
      const available = component.availableProjects();

      expect(available).toHaveLength(2);
      expect(available.map((p: any) => p._id)).toContain('project-1');
      expect(available.map((p: any) => p._id)).toContain('project-2');
    });

    it('should exclude on_hold projects', () => {
      component.projects.set(mockProjects);
      const available = component.availableProjects();

      const availableIds = available.map((p: any) => p._id);
      expect(availableIds).not.toContain('project-3');
    });
  });

  describe('Form Validation', () => {
    it('should show error when title is empty', () => {
      component.form.title = '';
      component.form.projectId = 'project-1';
      component.onSubmit();

      expect(component.error()).toBe('Title and Project are required');
      expect(taskStoreMock.updateTask).not.toHaveBeenCalled();
    });

    it('should show error when projectId is empty', () => {
      component.form.title = 'Test Task';
      component.form.projectId = '';
      component.onSubmit();

      expect(component.error()).toBe('Title and Project are required');
      expect(taskStoreMock.updateTask).not.toHaveBeenCalled();
    });
  });

  describe('Form Submission', () => {
    it('should update task with assigneeIds', () => {
      component.form.title = 'Updated Task';
      component.form.projectId = 'project-1';
      component.form.assigneeId = 'user-2';
      component.onSubmit();

      expect(taskStoreMock.updateTask).toHaveBeenCalledWith(
        'task-1',
        expect.objectContaining({
          assigneeIds: ['user-2'],
        })
      );
    });

    it('should update task with empty assigneeIds when no assignee', () => {
      component.form.title = 'Updated Task';
      component.form.projectId = 'project-1';
      component.form.assigneeId = '';
      component.onSubmit();

      expect(taskStoreMock.updateTask).toHaveBeenCalledWith(
        'task-1',
        expect.objectContaining({
          assigneeIds: [],
        })
      );
    });

    it('should include dueDate when provided', () => {
      component.form.title = 'Updated Task';
      component.form.projectId = 'project-1';
      component.form.dueDate = '2024-12-31';
      component.onSubmit();

      const callArg = taskStoreMock.updateTask.mock.calls[0][1];
      expect(callArg.dueDate).toBeInstanceOf(Date);
    });

    it('should not include dueDate when empty', () => {
      component.form.title = 'Updated Task';
      component.form.projectId = 'project-1';
      component.form.dueDate = '';
      component.onSubmit();

      const callArg = taskStoreMock.updateTask.mock.calls[0][1];
      expect(callArg.dueDate).toBeUndefined();
    });

    it('should call updateTask with correct payload', () => {
      component.form.title = 'Updated Task';
      component.form.projectId = 'project-1';
      component.onSubmit();

      expect(taskStoreMock.updateTask).toHaveBeenCalledWith(
        'task-1',
        expect.objectContaining({
          title: 'Updated Task',
          projectId: 'project-1',
        })
      );
    });

    it('should set error on failure', () => {
      taskStoreMock.updateTask.mockReturnValue({
        subscribe: (callbacks: any) => callbacks.error({ error: { message: 'Update failed' } }),
      });

      component.form.title = 'Updated Task';
      component.form.projectId = 'project-1';
      component.onSubmit();

      expect(component.error()).toBe('Update failed');
    });

    it('should set saving state during submission', () => {
      let savingDuringSubmit = false;
      taskStoreMock.updateTask.mockReturnValue({
        subscribe: (callbacks: any) => {
          savingDuringSubmit = component.saving();
          callbacks.next({ _id: 'task-1' });
        },
      });

      component.form.title = 'Updated Task';
      component.form.projectId = 'project-1';
      component.onSubmit();

      expect(savingDuringSubmit).toBe(true);
    });

    it('should reset saving state after submission', () => {
      component.form.title = 'Updated Task';
      component.form.projectId = 'project-1';
      component.onSubmit();

      expect(component.saving()).toBe(false);
    });
  });

  describe('Creator Name Display', () => {
    it('should return creator name when createdBy exists', () => {
      component.form.createdBy = 'user-1';
      expect(component.getCreatorName()).toBe('John Doe');
    });

    it('should return "Unknown" when createdBy is empty', () => {
      component.form.createdBy = '';
      expect(component.getCreatorName()).toBe('Unknown');
    });

    it('should return "Unknown" when user not found', () => {
      component.form.createdBy = 'non-existent';
      expect(component.getCreatorName()).toBe('Unknown');
    });
  });
});
