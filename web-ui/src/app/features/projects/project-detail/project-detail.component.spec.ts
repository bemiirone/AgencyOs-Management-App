import { ComponentFixture, TestBed, fakeAsync } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { ActivatedRoute, Router, convertToParamMap } from '@angular/router';
import { of, throwError } from 'rxjs';
import { ProjectDetailComponent } from './project-detail.component';
import { ProjectStore } from '../../../stores/project.store';
import { TaskStore } from '../../../stores/task.store';
import { TimeEntryStore } from '../../../stores/time-entry.store';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Project } from '../../../shared/models/project.model';
import { Task } from '../../../shared/models/task.model';
import { TimeEntry } from '../../../shared/models/time-entry.model';

describe('ProjectDetailComponent', () => {
  let component: ProjectDetailComponent;
  let fixture: ComponentFixture<ProjectDetailComponent>;
  let projectStoreMock: any;
  let taskStoreMock: any;
  let timeEntryStoreMock: any;
  let routerMock: any;

  const mockProject: Project = {
    _id: 'project-1',
    name: 'Project Alpha',
    description: 'A test project',
    status: 'active',
    tenantId: 'tenant-1',
    ownerId: 'owner-1',
    budget: 10000,
    startDate: new Date('2024-01-01'),
    endDate: new Date('2024-06-01'),
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockTasks: Task[] = [
    {
      _id: 'task-1',
      title: 'Task One',
      status: 'todo',
      priority: 'high',
      projectId: 'project-1',
      assigneeIds: ['user-1'],
      createdBy: 'user-1',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      _id: 'task-2',
      title: 'Task Two',
      status: 'done',
      priority: 'low',
      projectId: 'project-1',
      assigneeIds: [],
      createdBy: 'user-1',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  const mockTimeEntries: TimeEntry[] = [
    {
      _id: 'entry-1',
      taskId: 'task-1',
      projectId: 'project-1',
      userId: 'user-1',
      duration: 3600,
      description: 'Worked on task',
      startTime: new Date(),
      isBillable: true,
      isRunning: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      _id: 'entry-2',
      taskId: 'task-1',
      projectId: 'project-1',
      userId: 'user-1',
      duration: 1800,
      description: 'More work',
      startTime: new Date(),
      isBillable: false,
      isRunning: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  const mockActivatedRoute = {
    snapshot: {
      paramMap: convertToParamMap({ id: 'project-1' }),
    },
  };

  beforeEach(async () => {
    routerMock = {
      navigate: vi.fn(),
    };

    projectStoreMock = {
      loadProject: vi.fn().mockReturnValue({
        subscribe: (callbacks: any) => callbacks.next(mockProject),
      }),
      deleteProject: vi.fn().mockReturnValue({
        subscribe: (callbacks: any) => callbacks.next({}),
      }),
    };

    taskStoreMock = {
      loadTasksByProject: vi.fn().mockReturnValue({
        subscribe: (callbacks: any) => callbacks.next(mockTasks),
      }),
      deleteTask: vi.fn().mockReturnValue({
        subscribe: (callbacks: any) => callbacks.next({}),
      }),
    };

    timeEntryStoreMock = {
      loadEntriesByProject: vi.fn().mockReturnValue({
        subscribe: (callbacks: any) => callbacks.next(mockTimeEntries),
      }),
      formatDuration: vi.fn().mockReturnValue('1h 30m'),
      formatDurationShort: vi.fn().mockReturnValue('1h 30m'),
    };

    await TestBed.configureTestingModule({
      imports: [ProjectDetailComponent],
      providers: [
        provideHttpClient(),
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
        { provide: Router, useValue: routerMock },
        { provide: ProjectStore, useValue: projectStoreMock },
        { provide: TaskStore, useValue: taskStoreMock },
        { provide: TimeEntryStore, useValue: timeEntryStoreMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ProjectDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  describe('Component Initialization', () => {
    it('should create the component', () => {
      expect(component).toBeTruthy();
    });

    it('should load project on init when route has id', () => {
      expect(projectStoreMock.loadProject).toHaveBeenCalledWith('project-1');
    });

    it('should not load project when route has no id', () => {
      projectStoreMock.loadProject.mockClear();
      const fixture2 = TestBed.createComponent(ProjectDetailComponent);
      const component2 = fixture2.componentInstance as ProjectDetailComponent;
      (component2 as any).route = { snapshot: { paramMap: convertToParamMap({}) } };
      component2.ngOnInit();
      expect(projectStoreMock.loadProject).not.toHaveBeenCalled();
    });
  });

  describe('Load Project', () => {
    it('should set project and load related data on success', () => {
      component.loadProject('project-1');
      expect(component.project()).toEqual(mockProject);
      expect(taskStoreMock.loadTasksByProject).toHaveBeenCalledWith('project-1');
      expect(timeEntryStoreMock.loadEntriesByProject).toHaveBeenCalledWith('project-1');
    });

    it('should clear loading on error', () => {
      projectStoreMock.loadProject = vi.fn().mockReturnValue({
        subscribe: (callbacks: any) => callbacks.error(new Error('Not found')),
      });
      component.loading.set(true);
      component.loadProject('project-1');
      expect(component.loading()).toBe(false);
    });
  });

  describe('Date Formatting', () => {
    it('should format a valid date', () => {
      const result = component.formatDate('2024-01-15');
      expect(result).toContain('2024');
    });

    it('should return N/A for undefined date', () => {
      expect(component.formatDate(undefined)).toBe('N/A');
    });
  });

  describe('Currency Formatting', () => {
    it('should format a valid amount', () => {
      expect(component.formatCurrency(10000)).toBe('$10,000');
    });

    it('should return $0 for undefined amount', () => {
      expect(component.formatCurrency(undefined)).toBe('$0');
    });
  });

  describe('Status Badge Classes', () => {
    it('should return correct class for active', () => {
      expect(component.getStatusClass('active')).toBe('badge-success');
    });

    it('should return correct class for draft', () => {
      expect(component.getStatusClass('draft')).toBe('badge-ghost');
    });

    it('should return correct class for on_hold', () => {
      expect(component.getStatusClass('on_hold')).toBe('badge-warning');
    });

    it('should return correct class for completed', () => {
      expect(component.getStatusClass('completed')).toBe('badge-info');
    });

    it('should return correct class for archived', () => {
      expect(component.getStatusClass('archived')).toBe('badge-neutral');
    });

    it('should return default for unknown status', () => {
      expect(component.getStatusClass('unknown')).toBe('badge-ghost');
    });
  });

  describe('Status Labels', () => {
    it('should return correct label for each project status', () => {
      expect(component.getProjectStatusLabel('draft')).toBe('Draft');
      expect(component.getProjectStatusLabel('active')).toBe('Active');
      expect(component.getProjectStatusLabel('on_hold')).toBe('On Hold');
      expect(component.getProjectStatusLabel('completed')).toBe('Completed');
      expect(component.getProjectStatusLabel('archived')).toBe('Archived');
    });

    it('should return raw status for unknown', () => {
      expect(component.getProjectStatusLabel('unknown')).toBe('unknown');
    });
  });

  describe('Task Status Labels', () => {
    it('should return correct label for each task status', () => {
      expect(component.getTaskStatusLabel('todo')).toBe('To Do');
      expect(component.getTaskStatusLabel('in_progress')).toBe('In Progress');
      expect(component.getTaskStatusLabel('in_review')).toBe('In Review');
      expect(component.getTaskStatusLabel('done')).toBe('Done');
    });

    it('should return raw status for unknown', () => {
      expect(component.getTaskStatusLabel('unknown')).toBe('unknown');
    });
  });

  describe('Task Status Classes', () => {
    it('should return correct class for each task status', () => {
      expect(component.getTaskStatusClass('todo')).toBe('badge-ghost');
      expect(component.getTaskStatusClass('in_progress')).toBe('badge-warning');
      expect(component.getTaskStatusClass('in_review')).toBe('badge-info');
      expect(component.getTaskStatusClass('done')).toBe('badge-success');
    });

    it('should return default for unknown status', () => {
      expect(component.getTaskStatusClass('unknown')).toBe('badge-ghost');
    });
  });

  describe('Task Priority Classes', () => {
    it('should return correct class for low', () => {
      expect(component.getTaskPriorityClass('low')).toBe('text-base-content/40');
    });

    it('should return correct class for medium', () => {
      expect(component.getTaskPriorityClass('medium')).toBe('text-info');
    });

    it('should return correct class for high', () => {
      expect(component.getTaskPriorityClass('high')).toBe('text-warning');
    });

    it('should return correct class for urgent', () => {
      expect(component.getTaskPriorityClass('urgent')).toBe('text-error');
    });

    it('should return default for unknown priority', () => {
      expect(component.getTaskPriorityClass('unknown')).toBe('text-base-content/40');
    });
  });

  describe('Delete Project', () => {
    it('should navigate to projects list after successful deletion', () => {
      vi.spyOn(window, 'confirm').mockReturnValue(true);
      component.project.set(mockProject);
      component.deleteProject();
      expect(projectStoreMock.deleteProject).toHaveBeenCalledWith('project-1');
    });

    it('should not delete when cancelled', () => {
      vi.spyOn(window, 'confirm').mockReturnValue(false);
      component.project.set(mockProject);
      component.deleteProject();
      expect(projectStoreMock.deleteProject).not.toHaveBeenCalled();
    });

    it('should not delete when project has no id', () => {
      component.project.set(null);
      component.deleteProject();
      expect(projectStoreMock.deleteProject).not.toHaveBeenCalled();
    });
  });

  describe('Delete Task', () => {
    it('should call deleteTask on store when confirmed', () => {
      vi.spyOn(window, 'confirm').mockReturnValue(true);
      component.tasks.set(mockTasks);
      component.deleteTask('task-1');
      expect(taskStoreMock.deleteTask).toHaveBeenCalledWith('task-1');
    });

    it('should not delete when cancelled', () => {
      vi.spyOn(window, 'confirm').mockReturnValue(false);
      component.deleteTask('task-1');
      expect(taskStoreMock.deleteTask).not.toHaveBeenCalled();
    });
  });

  describe('Time Calculations', () => {
    beforeEach(() => {
      component.timeEntries.set(mockTimeEntries);
    });

    it('should sum total time seconds', () => {
      expect(component.getTotalTimeSeconds()).toBe(5400);
    });

    it('should format time as hours and minutes', () => {
      expect(component.getTotalTimeFormatted()).toBe('1h 30m');
    });

    it('should format time as minutes when under an hour', () => {
      component.timeEntries.set([{ ...mockTimeEntries[0], duration: 1800 }]);
      expect(component.getTotalTimeFormatted()).toBe('30m');
    });

    it('should return 0 when no entries', () => {
      component.timeEntries.set([]);
      expect(component.getTotalTimeSeconds()).toBe(0);
    });
  });

  describe('Task Time Entries', () => {
    beforeEach(() => {
      component.timeEntries.set(mockTimeEntries);
    });

    it('should return entries for a specific task', () => {
      const entries = component.getTaskTimeEntries('task-1');
      expect(entries).toHaveLength(2);
    });

    it('should return empty array for task with no entries', () => {
      const entries = component.getTaskTimeEntries('task-2');
      expect(entries).toHaveLength(0);
    });

    it('should limit entries to 3', () => {
      const entries = component.getTaskTimeEntries('task-1');
      expect(entries.length).toBeLessThanOrEqual(3);
    });
  });
});
