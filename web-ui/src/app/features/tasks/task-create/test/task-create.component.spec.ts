import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { RouterTestingModule } from '@angular/router/testing';
import { Router } from '@angular/router';
import { TaskCreateComponent } from '../task-create.component';
import { TaskStore } from '../../../../stores/task.store';
import { ProjectStore } from '../../../../stores/project.store';
import { UserStore } from '../../../../stores/user.store';
import { AuthService } from '../../../../core/services/auth.service';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { signal } from '@angular/core';

describe('TaskCreateComponent', () => {
  let component: TaskCreateComponent;
  let fixture: ComponentFixture<TaskCreateComponent>;
  let taskStoreMock: any;
  let projectStoreMock: any;
  let userStoreMock: any;
  let authServiceMock: any;
  let routerMock: any;

  const mockProjects = [
    { _id: 'project-1', name: 'Active Project', status: 'active' as const, tenantId: 'tenant-1', ownerId: 'owner-1', createdAt: new Date(), updatedAt: new Date() },
    { _id: 'project-2', name: 'Draft Project', status: 'draft' as const, tenantId: 'tenant-1', ownerId: 'owner-1', createdAt: new Date(), updatedAt: new Date() },
    { _id: 'project-3', name: 'On Hold Project', status: 'on_hold' as const, tenantId: 'tenant-1', ownerId: 'owner-1', createdAt: new Date(), updatedAt: new Date() },
    { _id: 'project-4', name: 'Completed Project', status: 'completed' as const, tenantId: 'tenant-1', ownerId: 'owner-1', createdAt: new Date(), updatedAt: new Date() },
    { _id: 'project-5', name: 'Archived Project', status: 'archived' as const, tenantId: 'tenant-1', ownerId: 'owner-1', createdAt: new Date(), updatedAt: new Date() },
  ];

  const mockUsers = [
    { id: 'user-1', name: 'John Doe' },
    { id: 'user-2', name: 'Jane Smith' },
  ];

  beforeEach(async () => {
    taskStoreMock = {
      createTask: vi.fn().mockReturnValue({
        subscribe: (callbacks: any) => callbacks.next({ _id: 'task-1', title: 'New Task' }),
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

    await TestBed.configureTestingModule({
      imports: [RouterTestingModule, TaskCreateComponent],
      providers: [
        provideHttpClient(),
        { provide: TaskStore, useValue: taskStoreMock },
        { provide: ProjectStore, useValue: projectStoreMock },
        { provide: UserStore, useValue: userStoreMock },
        { provide: AuthService, useValue: authServiceMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TaskCreateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  describe('Component Initialization', () => {
    it('should create the component', () => {
      expect(component).toBeTruthy();
    });

    it('should initialize form with default values', () => {
      expect(component.form.title).toBe('');
      expect(component.form.description).toBe('');
      expect(component.form.projectId).toBe('');
      expect(component.form.status).toBe('todo');
      expect(component.form.priority).toBe('medium');
      expect(component.form.dueDate).toBe('');
      expect(component.form.assigneeId).toBe('');
    });

    it('should load projects on init', () => {
      component.ngOnInit();
      expect(projectStoreMock.loadProjects).toHaveBeenCalled();
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

    it('should exclude on_hold, completed, and archived projects', () => {
      component.projects.set(mockProjects);
      const available = component.availableProjects();

      const availableIds = available.map((p: any) => p._id);
      expect(availableIds).not.toContain('project-3');
      expect(availableIds).not.toContain('project-4');
      expect(availableIds).not.toContain('project-5');
    });
  });

  describe('Form Validation', () => {
    it('should show error when title is empty', () => {
      component.form.title = '';
      component.form.projectId = 'project-1';
      component.onSubmit();

      expect(component.error()).toBe('Title and Project are required');
      expect(taskStoreMock.createTask).not.toHaveBeenCalled();
    });

    it('should show error when projectId is empty', () => {
      component.form.title = 'Test Task';
      component.form.projectId = '';
      component.onSubmit();

      expect(component.error()).toBe('Title and Project are required');
      expect(taskStoreMock.createTask).not.toHaveBeenCalled();
    });

    it('should show error when both title and projectId are empty', () => {
      component.form.title = '';
      component.form.projectId = '';
      component.onSubmit();

      expect(component.error()).toBe('Title and Project are required');
      expect(taskStoreMock.createTask).not.toHaveBeenCalled();
    });
  });

  describe('Form Submission', () => {
    it('should submit task with createdBy from AuthService', () => {
      component.form.title = 'Test Task';
      component.form.projectId = 'project-1';
      component.onSubmit();

      expect(taskStoreMock.createTask).toHaveBeenCalledWith(
        expect.objectContaining({
          createdBy: 'user-1',
        })
      );
    });

    it('should submit task with assigneeIds when assigneeId is provided', () => {
      component.form.title = 'Test Task';
      component.form.projectId = 'project-1';
      component.form.assigneeId = 'user-2';
      component.onSubmit();

      expect(taskStoreMock.createTask).toHaveBeenCalledWith(
        expect.objectContaining({
          assigneeIds: ['user-2'],
        })
      );
    });

    it('should submit task with empty assigneeIds when no assignee', () => {
      component.form.title = 'Test Task';
      component.form.projectId = 'project-1';
      component.form.assigneeId = '';
      component.onSubmit();

      expect(taskStoreMock.createTask).toHaveBeenCalledWith(
        expect.objectContaining({
          assigneeIds: [],
        })
      );
    });

    it('should include dueDate when provided', () => {
      component.form.title = 'Test Task';
      component.form.projectId = 'project-1';
      component.form.dueDate = '2024-12-31';
      component.onSubmit();

      const callArg = taskStoreMock.createTask.mock.calls[0][0];
      expect(callArg.dueDate).toBeInstanceOf(Date);
    });

    it('should not include dueDate when empty', () => {
      component.form.title = 'Test Task';
      component.form.projectId = 'project-1';
      component.form.dueDate = '';
      component.onSubmit();

      const callArg = taskStoreMock.createTask.mock.calls[0][0];
      expect(callArg.dueDate).toBeUndefined();
    });

    it('should call createTask with correct payload', () => {
      component.form.title = 'Test Task';
      component.form.projectId = 'project-1';
      component.onSubmit();

      expect(taskStoreMock.createTask).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Test Task',
          projectId: 'project-1',
        })
      );
    });

    it('should set error on failure', () => {
      taskStoreMock.createTask.mockReturnValue({
        subscribe: (callbacks: any) => callbacks.error({ error: { message: 'Creation failed' } }),
      });

      component.form.title = 'Test Task';
      component.form.projectId = 'project-1';
      component.onSubmit();

      expect(component.error()).toBe('Creation failed');
    });

    it('should set loading state during submission', () => {
      let loadingDuringSubmit = false;
      taskStoreMock.createTask.mockReturnValue({
        subscribe: (callbacks: any) => {
          loadingDuringSubmit = component.loading();
          callbacks.next({ _id: 'task-1' });
        },
      });

      component.form.title = 'Test Task';
      component.form.projectId = 'project-1';
      component.onSubmit();

      expect(loadingDuringSubmit).toBe(true);
    });

    it('should reset loading state after submission', () => {
      component.form.title = 'Test Task';
      component.form.projectId = 'project-1';
      component.onSubmit();

      expect(component.loading()).toBe(false);
    });
  });
});
