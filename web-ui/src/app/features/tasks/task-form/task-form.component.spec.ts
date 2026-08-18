import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { ActivatedRoute, Router, convertToParamMap } from '@angular/router';
import { of } from 'rxjs';
import { TaskFormComponent } from './task-form.component';
import { TaskStore } from '../../../stores/task.store';
import { ProjectStore } from '../../../stores/project.store';
import { UserStore } from '../../../stores/user.store';
import { AuthService } from '../../../core/services/auth.service';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { signal } from '@angular/core';
import { Task } from '../../../shared/models/task.model';

describe('TaskFormComponent', () => {
  let component: TaskFormComponent;
  let fixture: ComponentFixture<TaskFormComponent>;
  let taskStoreMock: any;
  let projectStoreMock: any;
  let userStoreMock: any;
  let authServiceMock: any;
  let routerMock: any;

  const mockProjects = [
    { _id: 'project-1', name: 'Active Project', status: 'active' as const, tenantId: 'tenant-1', ownerId: 'owner-1', createdAt: new Date(), updatedAt: new Date() },
    { _id: 'project-2', name: 'Draft Project', status: 'draft' as const, tenantId: 'tenant-1', ownerId: 'owner-1', createdAt: new Date(), updatedAt: new Date() },
    { _id: 'project-3', name: 'On Hold Project', status: 'on_hold' as const, tenantId: 'tenant-1', ownerId: 'owner-1', createdAt: new Date(), updatedAt: new Date() },
  ];

  const mockUsers = [
    { id: 'user-1', name: 'John Doe' },
    { id: 'user-2', name: 'Jane Smith' },
  ];

  const mockTask: Task = {
    _id: 'task-1',
    title: 'Existing Task',
    description: 'Task description',
    projectId: 'project-1',
    status: 'in_progress',
    priority: 'high',
    assigneeIds: ['user-2'],
    createdBy: 'user-1',
    dueDate: new Date('2024-12-31'),
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  function setupRouteWithId(id: string | null) {
    return {
      snapshot: {
        paramMap: convertToParamMap(id ? { id } : {}),
      },
    };
  }

  beforeEach(async () => {
    routerMock = {
      navigate: vi.fn().mockResolvedValue(true),
    };

    taskStoreMock = {
      loadTask: vi.fn().mockReturnValue({
        subscribe: (callbacks: any) => callbacks.next(mockTask),
      }),
      createTask: vi.fn().mockReturnValue({
        subscribe: (callbacks: any) => callbacks.next({ _id: 'task-new', title: 'New Task' }),
      }),
      updateTask: vi.fn().mockReturnValue({
        subscribe: (callbacks: any) => callbacks.next({ ...mockTask, title: 'Updated Task' }),
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
  });

  describe('Create Mode', () => {
    beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [TaskFormComponent],
        providers: [
          provideHttpClient(),
          { provide: ActivatedRoute, useValue: setupRouteWithId(null) },
          { provide: Router, useValue: routerMock },
          { provide: TaskStore, useValue: taskStoreMock },
          { provide: ProjectStore, useValue: projectStoreMock },
          { provide: UserStore, useValue: userStoreMock },
          { provide: AuthService, useValue: authServiceMock },
        ],
      }).compileComponents();

      fixture = TestBed.createComponent(TaskFormComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
    });

    it('should create the component', () => {
      expect(component).toBeTruthy();
    });

    it('should set mode to create', () => {
      expect(component.mode()).toBe('create');
    });

    it('should not be loading', () => {
      expect(component.loading()).toBe(false);
    });

    it('should initialize form with default values', () => {
      expect(component.taskForm.get('title')?.value).toBe('');
      expect(component.taskForm.get('description')?.value).toBe('');
      expect(component.taskForm.get('projectId')?.value).toBe('');
      expect(component.taskForm.get('status')?.value).toBe('todo');
      expect(component.taskForm.get('priority')?.value).toBe('medium');
      expect(component.taskForm.get('dueDate')?.value).toBe('');
      expect(component.taskForm.get('assigneeId')?.value).toBe('unassigned');
    });

    it('should load projects on init', () => {
      expect(projectStoreMock.loadProjects).toHaveBeenCalled();
    });

    it('should only include active and draft projects', () => {
      component.projects.set(mockProjects);
      const available = component.availableProjects();

      expect(available).toHaveLength(2);
      expect(available.map((p: any) => p._id)).toContain('project-1');
      expect(available.map((p: any) => p._id)).toContain('project-2');
    });

    it('should be invalid when title is empty', () => {
      component.taskForm.patchValue({ title: '', projectId: 'project-1' });
      expect(component.taskForm.invalid).toBe(true);
    });

    it('should be invalid when projectId is empty', () => {
      component.taskForm.patchValue({ title: 'Test Task', projectId: '' });
      expect(component.taskForm.invalid).toBe(true);
    });

    it('should not submit when form is invalid', () => {
      component.taskForm.patchValue({ title: '', projectId: '' });
      component.onSubmit();

      expect(taskStoreMock.createTask).not.toHaveBeenCalled();
    });

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

    it('should submit task with undefined assigneeIds when no assignee', () => {
      component.taskForm.patchValue({ title: 'Test Task', projectId: 'project-1', assigneeId: '' });
      component.onSubmit();

      expect(taskStoreMock.createTask).toHaveBeenCalledWith(
        expect.objectContaining({
          assigneeIds: undefined,
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
          loadingDuringSubmit = component.saving();
          callbacks.next({ _id: 'task-1' });
        },
      });

      component.taskForm.patchValue({ title: 'Test Task', projectId: 'project-1' });
      component.onSubmit();

      expect(loadingDuringSubmit).toBe(true);
    });

    it('should reset saving state after submission', () => {
      component.taskForm.patchValue({ title: 'Test Task', projectId: 'project-1' });
      component.onSubmit();

      expect(component.saving()).toBe(false);
    });
  });

  describe('Edit Mode', () => {
    beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [TaskFormComponent],
        providers: [
          provideHttpClient(),
          { provide: ActivatedRoute, useValue: setupRouteWithId('task-1') },
          { provide: Router, useValue: routerMock },
          { provide: TaskStore, useValue: taskStoreMock },
          { provide: ProjectStore, useValue: projectStoreMock },
          { provide: UserStore, useValue: userStoreMock },
          { provide: AuthService, useValue: authServiceMock },
        ],
      }).compileComponents();

      fixture = TestBed.createComponent(TaskFormComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
    });

    it('should create the component', () => {
      expect(component).toBeTruthy();
    });

    it('should set mode to edit', () => {
      expect(component.mode()).toBe('edit');
    });

    it('should set taskId from route', () => {
      expect(component.taskId()).toBe('task-1');
    });

    it('should load task data on init', () => {
      expect(taskStoreMock.loadTask).toHaveBeenCalledWith('task-1');
    });

    it('should populate form fields from loaded task', () => {
      expect(component.taskForm.get('title')?.value).toBe('Existing Task');
      expect(component.taskForm.get('description')?.value).toBe('Task description');
      expect(component.taskForm.get('projectId')?.value).toBe('project-1');
      expect(component.taskForm.get('status')?.value).toBe('in_progress');
      expect(component.taskForm.get('priority')?.value).toBe('high');
      expect(component.taskForm.get('assigneeId')?.value).toBe('user-2');
    });

    it('should convert dueDate to YYYY-MM-DD format', () => {
      expect(component.taskForm.get('dueDate')?.value).toBe('2024-12-31');
    });

    it('should not be loading after data is loaded', () => {
      expect(component.loading()).toBe(false);
    });

    it('should store loaded task', () => {
      expect(component.loadedTask()).toEqual(mockTask);
    });

    it('should get creator name correctly', () => {
      expect(component.getCreatorName()).toBe('John Doe');
    });

    it('should call updateTask with form data', () => {
      component.taskForm.patchValue({ title: 'Updated Title' });
      component.onSubmit();

      expect(taskStoreMock.updateTask).toHaveBeenCalledWith('task-1', expect.objectContaining({
        title: 'Updated Title',
      }));
    });

    it('should navigate to task detail on success', () => {
      component.taskForm.patchValue({ title: 'Updated Title' });
      component.onSubmit();

      expect(routerMock.navigate).toHaveBeenCalledWith(['/tasks', 'task-1'], { queryParamsHandling: 'preserve' });
    });

    it('should set error on failure', () => {
      taskStoreMock.updateTask = vi.fn().mockReturnValue({
        subscribe: (callbacks: any) => callbacks.error({ error: { message: 'Update failed' } }),
      });

      component.taskForm.patchValue({ title: 'Updated Title' });
      component.onSubmit();

      expect(component.error()).toBe('Update failed');
    });

    it('should handle missing optional fields', () => {
      taskStoreMock.loadTask = vi.fn().mockReturnValue({
        subscribe: (callbacks: any) =>
          callbacks.next({
            ...mockTask,
            description: undefined,
            assigneeIds: undefined,
            dueDate: undefined,
            createdBy: undefined,
          }),
      });
      const fixture2 = TestBed.createComponent(TaskFormComponent);
      const component2 = fixture2.componentInstance as TaskFormComponent;
      component2.ngOnInit();

      expect(component2.taskForm.get('description')?.value).toBe('');
      expect(component2.taskForm.get('assigneeId')?.value).toBe('unassigned');
      expect(component2.taskForm.get('dueDate')?.value).toBe('');
    });

    it('should set error message when loading fails', () => {
      taskStoreMock.loadTask = vi.fn().mockReturnValue({
        subscribe: (callbacks: any) => callbacks.error(new Error('Not found')),
      });
      const fixture2 = TestBed.createComponent(TaskFormComponent);
      const component2 = fixture2.componentInstance as TaskFormComponent;
      component2.ngOnInit();

      expect(component2.error()).toBe('Failed to load task');
      expect(component2.loading()).toBe(false);
    });

    it('should return Unknown for creator name when createdBy is missing', () => {
      component.loadedTask.set({ ...mockTask, createdBy: undefined });
      expect(component.getCreatorName()).toBe('Unknown');
    });
  });
});
