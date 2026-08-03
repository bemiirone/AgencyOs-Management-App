import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { ActivatedRoute, Router, convertToParamMap } from '@angular/router';
import { ProjectEditComponent } from './project-edit.component';
import { ProjectStore } from '../../../stores/project.store';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Project } from '../../../shared/models/project.model';

describe('ProjectEditComponent', () => {
  let component: ProjectEditComponent;
  let fixture: ComponentFixture<ProjectEditComponent>;
  let projectStoreMock: any;
  let routerMock: any;

  const mockProject: Project = {
    _id: 'project-1',
    name: 'Existing Project',
    description: 'Project description',
    status: 'active',
    tenantId: 'tenant-1',
    ownerId: 'owner-1',
    clientId: 'client-1',
    budget: 10000,
    startDate: new Date('2024-01-01'),
    endDate: new Date('2024-06-01'),
    createdAt: new Date(),
    updatedAt: new Date(),
  };

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
      updateProject: vi.fn().mockReturnValue({
        subscribe: (callbacks: any) =>
          callbacks.next({ ...mockProject, name: 'Updated Project' }),
      }),
    };

    await TestBed.configureTestingModule({
      imports: [ProjectEditComponent],
      providers: [
        provideHttpClient(),
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
        { provide: Router, useValue: routerMock },
        { provide: ProjectStore, useValue: projectStoreMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ProjectEditComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  describe('Component Initialization', () => {
    it('should create the component', () => {
      expect(component).toBeTruthy();
    });

    it('should load project data on init', () => {
      expect(projectStoreMock.loadProject).toHaveBeenCalledWith('project-1');
    });

    it('should set projectId from route', () => {
      expect(component.projectId()).toBe('project-1');
    });
  });

  describe('Load Project Data', () => {
    it('should populate form fields from loaded project', () => {
      expect(component.form.name).toBe('Existing Project');
      expect(component.form.description).toBe('Project description');
      expect(component.form.status).toBe('active');
      expect(component.form.clientId).toBe('client-1');
      expect(component.form.budget).toBe(10000);
    });

    it('should convert dates to YYYY-MM-DD format', () => {
      expect(component.form.startDate).toBe('2024-01-01');
      expect(component.form.endDate).toBe('2024-06-01');
    });

    it('should set dataLoaded to true after loading', () => {
      expect(component.dataLoaded()).toBe(true);
    });

    it('should set loading to false after loading', () => {
      expect(component.loading()).toBe(false);
    });

    it('should handle missing optional fields', () => {
      projectStoreMock.loadProject = vi.fn().mockReturnValue({
        subscribe: (callbacks: any) =>
          callbacks.next({
            ...mockProject,
            clientId: undefined,
            description: undefined,
            budget: undefined,
            startDate: undefined,
            endDate: undefined,
          }),
      });
      const fixture2 = TestBed.createComponent(ProjectEditComponent);
      const component2 = fixture2.componentInstance as ProjectEditComponent;
      component2.ngOnInit();

      expect(component2.form.clientId).toBe('');
      expect(component2.form.description).toBe('');
      expect(component2.form.budget).toBe(0);
      expect(component2.form.startDate).toBe('');
      expect(component2.form.endDate).toBe('');
    });
  });

  describe('Load Error', () => {
    it('should set error message when loading fails', () => {
      projectStoreMock.loadProject = vi.fn().mockReturnValue({
        subscribe: (callbacks: any) => callbacks.error(new Error('Not found')),
      });
      const fixture2 = TestBed.createComponent(ProjectEditComponent);
      const component2 = fixture2.componentInstance as ProjectEditComponent;
      component2.ngOnInit();

      expect(component2.error()).toBe('Failed to load project');
      expect(component2.loading()).toBe(false);
    });
  });

  describe('Missing Route ID', () => {
    it('should not load project when no ID in route', () => {
      projectStoreMock.loadProject.mockClear();
      const fixture2 = TestBed.createComponent(ProjectEditComponent);
      const component2 = fixture2.componentInstance as ProjectEditComponent;
      (component2 as any).route = { snapshot: { paramMap: convertToParamMap({}) } };
      component2.ngOnInit();

      expect(projectStoreMock.loadProject).not.toHaveBeenCalled();
      expect(component2.loading()).toBe(false);
    });
  });

  describe('Submit - Success', () => {
    it('should call updateProject with form data', () => {
      component.form.name = 'Updated Name';
      component.form.description = 'Updated description';
      component.form.status = 'completed';
      component.onSubmit();

      expect(projectStoreMock.updateProject).toHaveBeenCalledWith('project-1', {
        name: 'Updated Name',
        description: 'Updated description',
        status: 'completed',
        clientId: 'client-1',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-06-01'),
        budget: 10000,
      });
    });

    it('should include optional fields when provided', () => {
      component.form.clientId = 'client-2';
      component.form.startDate = '2024-03-01';
      component.form.endDate = '2024-09-01';
      component.form.budget = 15000;
      component.onSubmit();

      const callArg = projectStoreMock.updateProject.mock.calls[0][1];
      expect(callArg.clientId).toBe('client-2');
      expect(callArg.startDate).toEqual(new Date('2024-03-01'));
      expect(callArg.endDate).toEqual(new Date('2024-09-01'));
      expect(callArg.budget).toBe(15000);
    });

    it('should navigate to project detail on success', () => {
      component.form.name = 'Updated Name';
      component.onSubmit();

      expect(routerMock.navigate).toHaveBeenCalledWith(['/projects', 'project-1']);
    });

    it('should set saving to false on success', () => {
      component.form.name = 'Updated Name';
      component.onSubmit();

      expect(component.saving()).toBe(false);
    });
  });

  describe('Submit - Error', () => {
    it('should set error message on failure', () => {
      projectStoreMock.updateProject = vi.fn().mockReturnValue({
        subscribe: (callbacks: any) =>
          callbacks.error({ error: { message: 'Validation failed' } }),
      });
      component.form.name = 'Updated Name';
      component.onSubmit();

      expect(component.error()).toBe('Validation failed');
      expect(component.saving()).toBe(false);
    });

    it('should set generic error message when no message provided', () => {
      projectStoreMock.updateProject = vi.fn().mockReturnValue({
        subscribe: (callbacks: any) => callbacks.error({}),
      });
      component.form.name = 'Updated Name';
      component.onSubmit();

      expect(component.error()).toBe('Failed to update project');
    });

    it('should clear previous error before submitting', () => {
      component.error.set('Previous error');
      component.form.name = 'Updated Name';
      component.onSubmit();

      expect(component.error()).toBe('');
    });
  });

  describe('Form Validation Edge Cases', () => {
    it('should not include clientId when empty', () => {
      component.form.clientId = '';
      component.onSubmit();

      const callArg = projectStoreMock.updateProject.mock.calls[0][1];
      expect(callArg.clientId).toBeUndefined();
    });

    it('should not include startDate when empty', () => {
      component.form.startDate = '';
      component.onSubmit();

      const callArg = projectStoreMock.updateProject.mock.calls[0][1];
      expect(callArg.startDate).toBeUndefined();
    });

    it('should not include endDate when empty', () => {
      component.form.endDate = '';
      component.onSubmit();

      const callArg = projectStoreMock.updateProject.mock.calls[0][1];
      expect(callArg.endDate).toBeUndefined();
    });

    it('should not include budget when zero', () => {
      component.form.budget = 0;
      component.onSubmit();

      const callArg = projectStoreMock.updateProject.mock.calls[0][1];
      expect(callArg.budget).toBeUndefined();
    });
  });
});
