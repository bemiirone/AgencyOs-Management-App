import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { of } from 'rxjs';
import { TaskCreateComponent } from './task-create.component';
import { TaskStore } from '../../../stores/task.store';
import { ProjectStore } from '../../../stores/project.store';
import { UserStore } from '../../../stores/user.store';
import { AuthService } from '../../../core/services/auth.service';
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
        subscribe: (callbacks: any) => callbacks.next({ data: mockProjects, total: mockProjects.length, page: 1, limit: 10, totalPages: 1 }),
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
      navigate: vi.fn().mockResolvedValue(true),
    };

    await TestBed.configureTestingModule({
      imports: [TaskCreateComponent],
      providers: [
        provideHttpClient(),
        { provide: TaskStore, useValue: taskStoreMock },
        { provide: ProjectStore, useValue: projectStoreMock },
        { provide: UserStore, useValue: userStoreMock },
        { provide: AuthService, useValue: authServiceMock },
        { provide: Router, useValue: routerMock },
        { provide: ActivatedRoute, useValue: { snapshot: {} } },
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
      expect(component.taskForm.get('title')?.value).toBe('');
      expect(component.taskForm.get('description')?.value).toBe('');
      expect(component.taskForm.get('projectId')?.value).toBe('');
      expect(component.taskForm.get('status')?.value).toBe('todo');
      expect(component.taskForm.get('priority')?.value).toBe('medium');
      expect(component.taskForm.get('dueDate')?.value).toBe('');
      expect(component.taskForm.get('assigneeId')?.value).toBe('');
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
    it('should be invalid when title is empty', () => {
      component.taskForm.patchValue({ title: '', projectId: 'project-1' });
      expect(component.taskForm.invalid).toBe(true);
      expect(component.taskForm.get('title')?.errors?.['required']).toBeTruthy();
    });

    it('should be invalid when projectId is empty', () => {
      component.taskForm.patchValue({ title: 'Test Task', projectId: '' });
      expect(component.taskForm.invalid).toBe(true);
      expect(component.taskForm.get('projectId')?.errors?.['required']).toBeTruthy();
    });

    it('should be invalid when both title and projectId are empty', () => {
      component.taskForm.patchValue({ title: '', projectId: '' });
      expect(component.taskForm.invalid).toBe(true);
    });

    it('should not submit when form is invalid', () => {
      component.taskForm.patchValue({ title: '', projectId: '' });
      component.onSubmit();

      expect(taskStoreMock.createTask).not.toHaveBeenCalled();
    });
  });

  describe('Form Submission', () => {
    it('should submit task with createdBy from AuthService', () => {
      component.taskForm.patchValue({ title: 'Test Task', projectId: 'project-1' });
      component.onSubmit();

      expect(taskStoreMock.createTask).toHaveBeenCalledWith(
        expect.objectContaining({
          createdBy: 'user-1',
        })
      );
    });

    it('should submit task with assigneeIds when assigneeId is provided', () => {
      component.taskForm.patchValue({ title: 'Test Task', projectId: 'project-1', assigneeId: 'user-2' });
      component.onSubmit();

      expect(taskStoreMock.createTask).toHaveBeenCalledWith(
        expect.objectContaining({
          assigneeIds: ['user-2'],
        })
      );
    });

    it('should submit task with empty assigneeIds when no assignee', () => {
      component.taskForm.patchValue({ title: 'Test Task', projectId: 'project-1', assigneeId: '' });
      component.onSubmit();

      expect(taskStoreMock.createTask).toHaveBeenCalledWith(
        expect.objectContaining({
          assigneeIds: [],
        })
      );
    });

    it('should include dueDate when provided', () => {
      component.taskForm.patchValue({ title: 'Test Task', projectId: 'project-1', dueDate: '2024-12-31' });
      component.onSubmit();

      const callArg = taskStoreMock.createTask.mock.calls[0][0];
      expect(callArg.dueDate).toBeInstanceOf(Date);
    });

    it('should not include dueDate when empty', () => {
      component.taskForm.patchValue({ title: 'Test Task', projectId: 'project-1', dueDate: '' });
      component.onSubmit();

      const callArg = taskStoreMock.createTask.mock.calls[0][0];
      expect(callArg.dueDate).toBeUndefined();
    });

    it('should call createTask with correct payload', () => {
      component.taskForm.patchValue({ title: 'Test Task', projectId: 'project-1' });
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

      component.taskForm.patchValue({ title: 'Test Task', projectId: 'project-1' });
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

      component.taskForm.patchValue({ title: 'Test Task', projectId: 'project-1' });
      component.onSubmit();

      expect(loadingDuringSubmit).toBe(true);
    });

    it('should reset loading state after submission', () => {
      component.taskForm.patchValue({ title: 'Test Task', projectId: 'project-1' });
      component.onSubmit();

      expect(component.loading()).toBe(false);
    });
  });
});
