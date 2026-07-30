import { TestBed } from '@angular/core/testing';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { TaskStore } from '../task.store';
import { ToastService } from '../../core/services/toast.service';
import { API_CONFIG } from '../../core/config/api.config';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('TaskStore', () => {
  let store: TaskStore;
  let httpMock: HttpTestingController;
  let toastMock: { success: any; error: any; info: any; warning: any };

  const mockTask = {
    _id: 'task-1',
    title: 'Test Task',
    description: 'Test description',
    status: 'todo',
    priority: 'medium',
    projectId: 'project-1',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    toastMock = {
      success: vi.fn(),
      error: vi.fn(),
      info: vi.fn(),
      warning: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        TaskStore,
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting(),
        { provide: ToastService, useValue: toastMock },
      ],
    });

    store = TestBed.inject(TaskStore);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    vi.clearAllMocks();
  });

  describe('loadTasks', () => {
    it('should load tasks from API', () => {
      const mockTasks = [mockTask];

      store.loadTasks().subscribe((tasks) => {
        expect(tasks).toEqual(mockTasks);
        expect(store.tasks()).toEqual(mockTasks);
      });

      const req = httpMock.expectOne(API_CONFIG.TASKS.LIST);
      expect(req.request.method).toBe('GET');
      req.flush(mockTasks);
    });
  });

  describe('loadTasksByProject', () => {
    it('should load tasks for a specific project', () => {
      const projectId = 'project-1';
      const mockTasks = [mockTask];

      store.loadTasksByProject(projectId).subscribe((tasks) => {
        expect(tasks).toEqual(mockTasks);
      });

      const req = httpMock.expectOne(API_CONFIG.TASKS.BY_PROJECT(projectId));
      expect(req.request.method).toBe('GET');
      req.flush(mockTasks);
    });
  });

  describe('loadTask', () => {
    it('should load a single task by ID', () => {
      store.loadTask('task-1').subscribe((task) => {
        expect(task).toEqual(mockTask);
        expect(store.selectedTask()).toEqual(mockTask);
      });

      const req = httpMock.expectOne(API_CONFIG.TASKS.DETAIL('task-1'));
      expect(req.request.method).toBe('GET');
      req.flush(mockTask);
    });
  });

  describe('createTask', () => {
    it('should create a task and show success toast', () => {
      const createData = { title: 'New Task', projectId: 'project-1' };

      store.createTask(createData).subscribe((task) => {
        expect(task.title).toBe('New Task');
        expect(store.tasks()).toContain(task);
        expect(toastMock.success).toHaveBeenCalledWith('Task created successfully');
      });

      const req = httpMock.expectOne(API_CONFIG.TASKS.CREATE);
      expect(req.request.method).toBe('POST');
      req.flush({ ...mockTask, ...createData });
    });

    it('should show error toast on failure', () => {
      store.createTask({ title: 'Fail' }).subscribe({
        error: () => {
          expect(toastMock.error).toHaveBeenCalledWith('Failed to create task');
        },
      });

      const req = httpMock.expectOne(API_CONFIG.TASKS.CREATE);
      req.flush({ message: 'Error' }, { status: 400, statusText: 'Bad Request' });
    });
  });

  describe('updateTask', () => {
    it('should update a task and show success toast', () => {
      const updateData = { title: 'Updated Task' };

      store.updateTask('task-1', updateData).subscribe((task) => {
        expect(task.title).toBe('Updated Task');
        expect(toastMock.success).toHaveBeenCalledWith('Task updated successfully');
      });

      const req = httpMock.expectOne(API_CONFIG.TASKS.UPDATE('task-1'));
      expect(req.request.method).toBe('PATCH');
      req.flush({ ...mockTask, ...updateData });
    });
  });

  describe('deleteTask', () => {
    it('should delete a task and show success toast', () => {
      store.deleteTask('task-1').subscribe(() => {
        expect(toastMock.success).toHaveBeenCalledWith('Task deleted successfully');
      });

      const req = httpMock.expectOne(API_CONFIG.TASKS.DELETE('task-1'));
      expect(req.request.method).toBe('DELETE');
      req.flush({ success: true });
    });
  });

  describe('updateTaskStatus', () => {
    it('should update task status', () => {
      store.updateTaskStatus('task-1', 'done').subscribe((task) => {
        expect(task.status).toBe('done');
      });

      const req = httpMock.expectOne(API_CONFIG.TASKS.UPDATE_STATUS('task-1'));
      expect(req.request.method).toBe('PATCH');
      expect(req.request.body).toEqual({ status: 'done' });
      req.flush({ ...mockTask, status: 'done' });
    });

    it('should show error toast on failure', () => {
      store.updateTaskStatus('task-1', 'done').subscribe({
        error: () => {
          expect(toastMock.error).toHaveBeenCalledWith('Failed to update task status');
        },
      });

      const req = httpMock.expectOne(API_CONFIG.TASKS.UPDATE_STATUS('task-1'));
      req.flush({ message: 'Error' }, { status: 400, statusText: 'Bad Request' });
    });
  });
});
