import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { RouterTestingModule } from '@angular/router/testing';
import { TaskListComponent } from './task-list.component';
import { TaskStore } from '../../../stores/task.store';
import { ProjectStore } from '../../../stores/project.store';
import { UserStore } from '../../../stores/user.store';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { signal } from '@angular/core';

describe('TaskListComponent', () => {
  let component: TaskListComponent;
  let fixture: ComponentFixture<TaskListComponent>;
  let taskStoreMock: any;
  let projectStoreMock: any;
  let userStoreMock: any;

  const mockUsers = [
    { id: 'user-1', name: 'John Doe' },
    { id: 'user-2', name: 'Jane Smith' },
  ];

  const mockProjects = [
    { _id: 'project-1', name: 'Project Alpha', status: 'active' as const, tenantId: 'tenant-1', ownerId: 'owner-1', createdAt: new Date(), updatedAt: new Date() },
    { _id: 'project-2', name: 'Project Beta', status: 'draft' as const, tenantId: 'tenant-1', ownerId: 'owner-1', createdAt: new Date(), updatedAt: new Date() },
  ];

  const mockTasks = [
    {
      _id: 'task-1',
      title: 'Task One',
      description: 'Description one',
      status: 'todo' as const,
      priority: 'high' as const,
      projectId: 'project-1',
      assigneeIds: ['user-1'],
      createdBy: 'user-2',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      _id: 'task-2',
      title: 'Task Two',
      description: 'Description two',
      status: 'done' as const,
      priority: 'low' as const,
      projectId: 'project-2',
      assigneeIds: [],
      createdBy: '',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  beforeEach(async () => {
    const paginatedTasks = {
      data: mockTasks,
      total: mockTasks.length,
      page: 1,
      limit: 10,
      totalPages: 1,
    };

    const paginatedProjects = {
      data: mockProjects,
      total: mockProjects.length,
      page: 1,
      limit: 10,
      totalPages: 1,
    };

    taskStoreMock = {
      loadTasks: vi.fn().mockReturnValue({
        subscribe: (callbacks: any) => callbacks.next(paginatedTasks),
      }),
      loadAllTasks: vi.fn().mockReturnValue({
        subscribe: (callbacks: any) => callbacks.next(paginatedTasks),
      }),
      deleteTask: vi.fn(),
    };

    projectStoreMock = {
      loadProjects: vi.fn().mockReturnValue({
        subscribe: (callbacks: any) => callbacks.next(paginatedProjects),
      }),
      loadAllProjects: vi.fn().mockReturnValue({
        subscribe: (callbacks: any) => callbacks.next(paginatedProjects),
      }),
    };

    userStoreMock = {
      users: signal(mockUsers),
      loadUsers: vi.fn().mockReturnValue({
        subscribe: (callbacks: any) => callbacks.next(mockUsers),
      }),
    };

    await TestBed.configureTestingModule({
      imports: [RouterTestingModule, TaskListComponent],
      providers: [
        provideHttpClient(),
        { provide: TaskStore, useValue: taskStoreMock },
        { provide: ProjectStore, useValue: projectStoreMock },
        { provide: UserStore, useValue: userStoreMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TaskListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  describe('Component Initialization', () => {
    it('should create the component', () => {
      expect(component).toBeTruthy();
    });

    it('should load tasks on init', () => {
      component.ngOnInit();
      expect(taskStoreMock.loadAllTasks).toHaveBeenCalled();
    });

    it('should load projects on init', () => {
      component.ngOnInit();
      expect(projectStoreMock.loadProjects).toHaveBeenCalled();
    });
  });

  describe('Filter Functionality', () => {
    it('should return all tasks when no filters applied', () => {
      component.searchQuery.set('');
      component.statusFilter.set('');
      component.priorityFilter.set('');
      component.projectFilter.set('');
      component.assigneeFilter.set('');

      expect(component.filteredTasks).toHaveLength(2);
    });

    it('should filter by search query', () => {
      component.searchQuery.set('Task One');
      component.statusFilter.set('');
      component.priorityFilter.set('');
      component.projectFilter.set('');
      component.assigneeFilter.set('');

      expect(component.filteredTasks).toHaveLength(1);
      expect(component.filteredTasks[0].title).toBe('Task One');
    });

    it('should filter by status', () => {
      component.searchQuery.set('');
      component.statusFilter.set('done');
      component.priorityFilter.set('');
      component.projectFilter.set('');
      component.assigneeFilter.set('');

      expect(component.filteredTasks).toHaveLength(1);
      expect(component.filteredTasks[0].status).toBe('done');
    });

    it('should filter by priority', () => {
      component.searchQuery.set('');
      component.statusFilter.set('');
      component.priorityFilter.set('high');
      component.projectFilter.set('');
      component.assigneeFilter.set('');

      expect(component.filteredTasks).toHaveLength(1);
      expect(component.filteredTasks[0].priority).toBe('high');
    });

    it('should filter by project', () => {
      component.searchQuery.set('');
      component.statusFilter.set('');
      component.priorityFilter.set('');
      component.projectFilter.set('project-1');
      component.assigneeFilter.set('');

      expect(component.filteredTasks).toHaveLength(1);
      expect(component.filteredTasks[0].projectId).toBe('project-1');
    });

    it('should filter by assignee', () => {
      component.searchQuery.set('');
      component.statusFilter.set('');
      component.priorityFilter.set('');
      component.projectFilter.set('');
      component.assigneeFilter.set('user-1');

      expect(component.filteredTasks).toHaveLength(1);
      expect(component.filteredTasks[0].assigneeIds).toContain('user-1');
    });

    it('should apply multiple filters together', () => {
      component.searchQuery.set('');
      component.statusFilter.set('todo');
      component.priorityFilter.set('');
      component.projectFilter.set('project-1');
      component.assigneeFilter.set('');

      expect(component.filteredTasks).toHaveLength(1);
    });
  });

  describe('User Name Helpers', () => {
    it('should return user name by ID', () => {
      expect(component.getUserName('user-1')).toBe('John Doe');
    });

    it('should return fallback when user ID not found', () => {
      expect(component.getUserName('non-existent')).toBe('Unknown');
    });

    it('should return fallback when user ID is empty', () => {
      expect(component.getUserName('')).toBe('Unknown');
    });

    it('should return custom fallback when provided', () => {
      expect(component.getUserName('non-existent', 'N/A')).toBe('N/A');
    });
  });

  describe('Assignee Helpers', () => {
    it('should return assignee name when assigned', () => {
      const task = mockTasks[0];
      expect(component.getAssigneeName(task)).toBe('John Doe');
    });

    it('should return "Unassigned" when no assignee', () => {
      const task = mockTasks[1];
      expect(component.getAssigneeName(task)).toBe('Unassigned');
    });

    it('should return assignee ID', () => {
      const task = mockTasks[0];
      expect(component.getAssigneeId(task)).toBe('user-1');
    });

    it('should return empty string when no assignee', () => {
      const task = mockTasks[1];
      expect(component.getAssigneeId(task)).toBe('');
    });
  });

  describe('Creator Helpers', () => {
    it('should return creator name when createdBy exists', () => {
      const task = mockTasks[0];
      expect(component.getCreatorName(task)).toBe('Jane Smith');
    });

    it('should return "Unknown" when createdBy is empty', () => {
      const task = mockTasks[1];
      expect(component.getCreatorName(task)).toBe('Unknown');
    });

    it('should return creator ID', () => {
      const task = mockTasks[0];
      expect(component.getCreatorId(task)).toBe('user-2');
    });
  });

  describe('Avatar Helpers', () => {
    it('should get initials from name', () => {
      expect(component.getInitials('John Doe')).toBe('JD');
    });

    it('should get initials from single name', () => {
      expect(component.getInitials('John')).toBe('J');
    });

    it('should limit initials to 2 characters', () => {
      expect(component.getInitials('John Michael Doe')).toBe('JM');
    });

    it('should return consistent avatar color for same ID', () => {
      const color1 = component.getAvatarColorById('user-1');
      const color2 = component.getAvatarColorById('user-1');
      expect(color1).toBe(color2);
    });

    it('should return valid DaisyUI color class', () => {
      const color = component.getAvatarColorById('user-1');
      const validColors = ['bg-primary', 'bg-secondary', 'bg-accent', 'bg-info', 'bg-success', 'bg-warning', 'bg-error'];
      expect(validColors).toContain(color);
    });
  });

  describe('Status and Priority Labels', () => {
    it('should return correct status label', () => {
      expect(component.getStatusLabel('todo')).toBe('To Do');
      expect(component.getStatusLabel('in_progress')).toBe('In Progress');
      expect(component.getStatusLabel('in_review')).toBe('In Review');
      expect(component.getStatusLabel('done')).toBe('Done');
    });

    it('should return correct priority label', () => {
      expect(component.getPriorityLabel('low')).toBe('Low');
      expect(component.getPriorityLabel('medium')).toBe('Medium');
      expect(component.getPriorityLabel('high')).toBe('High');
      expect(component.getPriorityLabel('urgent')).toBe('Urgent');
    });

    it('should return correct status badge class', () => {
      expect(component.getStatusBadgeClass('todo')).toBe('badge-ghost');
      expect(component.getStatusBadgeClass('in_progress')).toBe('badge-warning');
      expect(component.getStatusBadgeClass('in_review')).toBe('badge-info');
      expect(component.getStatusBadgeClass('done')).toBe('badge-success');
    });

    it('should return correct priority badge class', () => {
      expect(component.getPriorityBadgeClass('low')).toBe('badge-ghost');
      expect(component.getPriorityBadgeClass('medium')).toBe('badge-info');
      expect(component.getPriorityBadgeClass('high')).toBe('badge-warning');
      expect(component.getPriorityBadgeClass('urgent')).toBe('badge-error');
    });
  });

  describe('Project Name Lookup', () => {
    it('should return project name by ID', () => {
      component.projects.set(mockProjects);
      expect(component.getProjectName('project-1')).toBe('Project Alpha');
    });

    it('should return "Unknown" when project not found', () => {
      component.projects.set(mockProjects);
      expect(component.getProjectName('non-existent')).toBe('Unknown');
    });
  });

  describe('Date Formatting', () => {
    it('should format date string', () => {
      const result = component.formatDate('2024-01-15');
      expect(result).toContain('2024');
    });

    it('should return "N/A" for undefined date', () => {
      expect(component.formatDate(undefined)).toBe('N/A');
    });
  });
});
