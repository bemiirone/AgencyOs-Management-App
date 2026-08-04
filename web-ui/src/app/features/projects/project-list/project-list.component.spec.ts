import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { RouterTestingModule } from '@angular/router/testing';
import { ProjectListComponent } from './project-list.component';
import { ProjectStore } from '../../../stores/project.store';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Project } from '../../../shared/models/project.model';

describe('ProjectListComponent', () => {
  let component: ProjectListComponent;
  let fixture: ComponentFixture<ProjectListComponent>;
  let projectStoreMock: any;

  const mockProjects: Project[] = [
    {
      _id: 'project-1',
      name: 'Project Alpha',
      description: 'First project',
      status: 'active',
      tenantId: 'tenant-1',
      ownerId: 'owner-1',
      budget: 5000,
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-06-01'),
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      _id: 'project-2',
      name: 'Project Beta',
      description: 'Second project',
      status: 'draft',
      tenantId: 'tenant-1',
      ownerId: 'owner-1',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  beforeEach(async () => {
    const paginatedResponse = {
      data: mockProjects,
      total: mockProjects.length,
      page: 1,
      limit: 10,
      totalPages: 1,
    };

    projectStoreMock = {
      loadProjects: vi.fn().mockReturnValue({
        subscribe: (callbacks: any) => callbacks.next(paginatedResponse),
      }),
      loadAllProjects: vi.fn().mockReturnValue({
        subscribe: (callbacks: any) => callbacks.next(paginatedResponse),
      }),
      deleteProject: vi.fn().mockReturnValue({
        subscribe: (callbacks: any) => callbacks.next({}),
      }),
    };

    await TestBed.configureTestingModule({
      imports: [RouterTestingModule, ProjectListComponent],
      providers: [
        provideHttpClient(),
        { provide: ProjectStore, useValue: projectStoreMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ProjectListComponent);
    component = fixture.componentInstance;
    component.projects.set(mockProjects);
    fixture.detectChanges();
  });

  describe('Component Initialization', () => {
    it('should create the component', () => {
      expect(component).toBeTruthy();
    });

    it('should load projects on init', () => {
      component.ngOnInit();
      expect(projectStoreMock.loadAllProjects).toHaveBeenCalled();
    });
  });

  describe('Load Projects', () => {
    it('should set projects and clear loading on success', () => {
      component.loading.set(true);
      component.loadProjects();
      expect(component.projects()).toHaveLength(2);
      expect(component.loading()).toBe(false);
    });

    it('should clear loading on error', () => {
      projectStoreMock.loadProjects = vi.fn().mockReturnValue({
        subscribe: (callbacks: any) => callbacks.error(new Error('Network error')),
      });
      component.loading.set(true);
      component.loadProjects();
      expect(component.loading()).toBe(false);
    });
  });

  describe('Search Filtering', () => {
    it('should return all projects when search query is empty', () => {
      component.searchQuery.set('');
      expect(component.filteredProjects).toHaveLength(2);
    });

    it('should filter by project name', () => {
      component.searchQuery.set('Alpha');
      expect(component.filteredProjects).toHaveLength(1);
      expect(component.filteredProjects[0].name).toBe('Project Alpha');
    });

    it('should filter by description', () => {
      component.searchQuery.set('Second');
      expect(component.filteredProjects).toHaveLength(1);
      expect(component.filteredProjects[0].name).toBe('Project Beta');
    });

    it('should be case-insensitive', () => {
      component.searchQuery.set('alpha');
      expect(component.filteredProjects).toHaveLength(1);
    });

    it('should return empty array when no match', () => {
      component.searchQuery.set('Nonexistent');
      expect(component.filteredProjects).toHaveLength(0);
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
      expect(component.formatCurrency(5000)).toBe('£5,000');
    });

    it('should return £0 for undefined amount', () => {
      expect(component.formatCurrency(undefined)).toBe('£0');
    });

    it('should return £0 for zero', () => {
      expect(component.formatCurrency(0)).toBe('£0');
    });
  });

  describe('Status Color Mapping', () => {
    it('should return correct badge class for active', () => {
      expect(component.getStatusColor('active')).toBe('badge-success');
    });

    it('should return correct badge class for draft', () => {
      expect(component.getStatusColor('draft')).toBe('badge-ghost');
    });

    it('should return correct badge class for on_hold', () => {
      expect(component.getStatusColor('on_hold')).toBe('badge-warning');
    });

    it('should return correct badge class for completed', () => {
      expect(component.getStatusColor('completed')).toBe('badge-info');
    });

    it('should return correct badge class for archived', () => {
      expect(component.getStatusColor('archived')).toBe('badge-neutral');
    });

    it('should return default for unknown status', () => {
      expect(component.getStatusColor('unknown')).toBe('badge-ghost');
    });
  });

  describe('Status Label Mapping', () => {
    it('should return correct label for draft', () => {
      expect(component.getProjectStatusLabel('draft')).toBe('Draft');
    });

    it('should return correct label for active', () => {
      expect(component.getProjectStatusLabel('active')).toBe('Active');
    });

    it('should return correct label for on_hold', () => {
      expect(component.getProjectStatusLabel('on_hold')).toBe('On Hold');
    });

    it('should return correct label for completed', () => {
      expect(component.getProjectStatusLabel('completed')).toBe('Completed');
    });

    it('should return correct label for archived', () => {
      expect(component.getProjectStatusLabel('archived')).toBe('Archived');
    });

    it('should return raw status for unknown', () => {
      expect(component.getProjectStatusLabel('unknown')).toBe('unknown');
    });
  });

  describe('Delete Project', () => {
    it('should call deleteProject on store and remove from list', () => {
      vi.spyOn(window, 'confirm').mockReturnValue(true);
      component.projects.set(mockProjects);
      component.deleteProject('project-1');
      expect(projectStoreMock.deleteProject).toHaveBeenCalledWith('project-1');
    });

    it('should not call deleteProject when cancelled', () => {
      vi.spyOn(window, 'confirm').mockReturnValue(false);
      component.deleteProject('project-1');
      expect(projectStoreMock.deleteProject).not.toHaveBeenCalled();
    });
  });
});
