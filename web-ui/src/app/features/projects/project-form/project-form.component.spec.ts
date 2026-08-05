import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { ActivatedRoute, Router, convertToParamMap } from '@angular/router';
import { ProjectFormComponent } from './project-form.component';
import { ProjectStore } from '../../../stores/project.store';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Project } from '../../../shared/models/project.model';

describe('ProjectFormComponent', () => {
  let component: ProjectFormComponent;
  let fixture: ComponentFixture<ProjectFormComponent>;
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
    clientName: 'Test Client',
    clientEmail: 'test@example.com',
    budget: 10000,
    startDate: new Date('2024-01-01'),
    endDate: new Date('2024-06-01'),
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

    projectStoreMock = {
      loadProject: vi.fn().mockReturnValue({
        subscribe: (callbacks: any) => callbacks.next(mockProject),
      }),
      createProject: vi.fn().mockReturnValue({
        subscribe: (callbacks: any) =>
          callbacks.next({ _id: 'new-project-1', name: 'New Project', clientName: 'Test Client', clientEmail: 'test@example.com' }),
      }),
      updateProject: vi.fn().mockReturnValue({
        subscribe: (callbacks: any) =>
          callbacks.next({ ...mockProject, name: 'Updated Project' }),
      }),
    };
  });

  describe('Create Mode', () => {
    beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [ProjectFormComponent],
        providers: [
          provideHttpClient(),
          { provide: ActivatedRoute, useValue: setupRouteWithId(null) },
          { provide: Router, useValue: routerMock },
          { provide: ProjectStore, useValue: projectStoreMock },
        ],
      }).compileComponents();

      fixture = TestBed.createComponent(ProjectFormComponent);
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
      expect(component.projectForm.get('name')?.value).toBe('');
      expect(component.projectForm.get('description')?.value).toBe('');
      expect(component.projectForm.get('status')?.value).toBe('draft');
      expect(component.projectForm.get('clientName')?.value).toBe('');
      expect(component.projectForm.get('clientEmail')?.value).toBe('');
    });

    it('should require clientName in create mode', () => {
      component.projectForm.get('clientName')?.setValue('');
      expect(component.projectForm.get('clientName')?.invalid).toBe(true);
    });

    it('should require clientEmail in create mode', () => {
      component.projectForm.get('clientEmail')?.setValue('');
      expect(component.projectForm.get('clientEmail')?.invalid).toBe(true);
    });

    it('should be invalid when required fields are empty', () => {
      expect(component.projectForm.invalid).toBe(true);
    });

    it('should not submit when form is invalid', () => {
      component.onSubmit();
      expect(projectStoreMock.createProject).not.toHaveBeenCalled();
    });

    it('should call createProject with required fields', () => {
      component.projectForm.patchValue({
        name: 'Test Project',
        clientName: 'Test Client',
        clientEmail: 'test@example.com',
      });
      component.onSubmit();

      expect(projectStoreMock.createProject).toHaveBeenCalledWith({
        name: 'Test Project',
        description: '',
        status: 'draft',
        clientName: 'Test Client',
        clientEmail: 'test@example.com',
      });
    });

    it('should navigate to project detail on success', () => {
      component.projectForm.patchValue({
        name: 'Test Project',
        clientName: 'Test Client',
        clientEmail: 'test@example.com',
      });
      component.onSubmit();

      expect(routerMock.navigate).toHaveBeenCalledWith(['/projects', 'new-project-1'], { queryParamsHandling: 'preserve' });
    });

    it('should include optional fields when provided', () => {
      component.projectForm.patchValue({
        name: 'Full Project',
        description: 'A description',
        status: 'active',
        clientId: 'client-1',
        clientName: 'Test Client',
        clientEmail: 'test@example.com',
        startDate: '2024-01-01',
        endDate: '2024-06-01',
        budget: 5000,
      });
      component.onSubmit();

      expect(projectStoreMock.createProject).toHaveBeenCalledWith({
        name: 'Full Project',
        description: 'A description',
        status: 'active',
        clientId: 'client-1',
        clientName: 'Test Client',
        clientEmail: 'test@example.com',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-06-01'),
        budget: 5000,
      });
    });

    it('should set error on failure', () => {
      projectStoreMock.createProject = vi.fn().mockReturnValue({
        subscribe: (callbacks: any) =>
          callbacks.error({ error: { message: 'Duplicate name' } }),
      });
      component.projectForm.patchValue({
        name: 'Test Project',
        clientName: 'Test Client',
        clientEmail: 'test@example.com',
      });
      component.onSubmit();

      expect(component.error()).toBe('Duplicate name');
    });
  });

  describe('Edit Mode', () => {
    beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [ProjectFormComponent],
        providers: [
          provideHttpClient(),
          { provide: ActivatedRoute, useValue: setupRouteWithId('project-1') },
          { provide: Router, useValue: routerMock },
          { provide: ProjectStore, useValue: projectStoreMock },
        ],
      }).compileComponents();

      fixture = TestBed.createComponent(ProjectFormComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
    });

    it('should create the component', () => {
      expect(component).toBeTruthy();
    });

    it('should set mode to edit', () => {
      expect(component.mode()).toBe('edit');
    });

    it('should set projectId from route', () => {
      expect(component.projectId()).toBe('project-1');
    });

    it('should load project data on init', () => {
      expect(projectStoreMock.loadProject).toHaveBeenCalledWith('project-1');
    });

    it('should populate form fields from loaded project', () => {
      expect(component.projectForm.get('name')?.value).toBe('Existing Project');
      expect(component.projectForm.get('description')?.value).toBe('Project description');
      expect(component.projectForm.get('status')?.value).toBe('active');
      expect(component.projectForm.get('clientId')?.value).toBe('client-1');
      expect(component.projectForm.get('clientName')?.value).toBe('Test Client');
      expect(component.projectForm.get('clientEmail')?.value).toBe('test@example.com');
      expect(component.projectForm.get('budget')?.value).toBe(10000);
    });

    it('should convert dates to YYYY-MM-DD format', () => {
      expect(component.projectForm.get('startDate')?.value).toBe('2024-01-01');
      expect(component.projectForm.get('endDate')?.value).toBe('2024-06-01');
    });

    it('should not be loading after data is loaded', () => {
      expect(component.loading()).toBe(false);
    });

    it('should not require clientName in edit mode', () => {
      const control = component.projectForm.get('clientName');
      control?.setValue('');
      expect(control?.valid).toBe(true);
    });

    it('should call updateProject with form data', () => {
      component.projectForm.patchValue({ name: 'Updated Name' });
      component.onSubmit();

      expect(projectStoreMock.updateProject).toHaveBeenCalledWith('project-1', expect.objectContaining({
        name: 'Updated Name',
      }));
    });

    it('should navigate to project detail on success', () => {
      component.projectForm.patchValue({ name: 'Updated Name' });
      component.onSubmit();

      expect(routerMock.navigate).toHaveBeenCalledWith(['/projects', 'project-1'], { queryParamsHandling: 'preserve' });
    });

    it('should set error on failure', () => {
      projectStoreMock.updateProject = vi.fn().mockReturnValue({
        subscribe: (callbacks: any) =>
          callbacks.error({ error: { message: 'Validation failed' } }),
      });
      component.projectForm.patchValue({ name: 'Updated Name' });
      component.onSubmit();

      expect(component.error()).toBe('Validation failed');
    });

    it('should handle missing optional fields', () => {
      projectStoreMock.loadProject = vi.fn().mockReturnValue({
        subscribe: (callbacks: any) =>
          callbacks.next({
            ...mockProject,
            clientId: undefined,
            clientName: undefined,
            clientEmail: undefined,
            description: undefined,
            budget: undefined,
            startDate: undefined,
            endDate: undefined,
          }),
      });
      const fixture2 = TestBed.createComponent(ProjectFormComponent);
      const component2 = fixture2.componentInstance as ProjectFormComponent;
      component2.ngOnInit();

      expect(component2.projectForm.get('clientId')?.value).toBe('');
      expect(component2.projectForm.get('clientName')?.value).toBe('');
      expect(component2.projectForm.get('clientEmail')?.value).toBe('');
      expect(component2.projectForm.get('description')?.value).toBe('');
      expect(component2.projectForm.get('budget')?.value).toBe(0);
    });

    it('should set error message when loading fails', () => {
      projectStoreMock.loadProject = vi.fn().mockReturnValue({
        subscribe: (callbacks: any) => callbacks.error(new Error('Not found')),
      });
      const fixture2 = TestBed.createComponent(ProjectFormComponent);
      const component2 = fixture2.componentInstance as ProjectFormComponent;
      component2.ngOnInit();

      expect(component2.error()).toBe('Failed to load project');
      expect(component2.loading()).toBe(false);
    });
  });
});
