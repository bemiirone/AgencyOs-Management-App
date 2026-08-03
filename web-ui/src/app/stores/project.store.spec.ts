import { TestBed } from '@angular/core/testing';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { ProjectStore } from './project.store';
import { ToastService } from '../core/services/toast.service';
import { API_CONFIG } from '../core/config/api.config';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('ProjectStore', () => {
  let store: ProjectStore;
  let httpMock: HttpTestingController;
  let toastMock: { success: any; error: any; info: any; warning: any };

  const mockProject = {
    _id: 'project-1',
    name: 'Test Project',
    description: 'Test description',
    status: 'active',
    tenantId: 'tenant-1',
    ownerId: 'owner-1',
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
        ProjectStore,
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting(),
        { provide: ToastService, useValue: toastMock },
      ],
    });

    store = TestBed.inject(ProjectStore);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    vi.clearAllMocks();
  });

  describe('loadProjects', () => {
    it('should load projects from API', () => {
      const mockProjects = [mockProject];

      store.loadProjects().subscribe((projects) => {
        expect(projects).toEqual(mockProjects);
        expect(store.projects()).toEqual(mockProjects);
      });

      const req = httpMock.expectOne(API_CONFIG.PROJECTS.LIST);
      expect(req.request.method).toBe('GET');
      req.flush(mockProjects);
    });

    it('should set error on failure', () => {
      store.loadProjects().subscribe({
        error: (error) => {
          expect(error.status).toBe(500);
        },
      });

      const req = httpMock.expectOne(API_CONFIG.PROJECTS.LIST);
      req.flush({ message: 'Server error' }, { status: 500, statusText: 'Error' });
    });
  });

  describe('createProject', () => {
    it('should create a project and show success toast', () => {
      const createData = { name: 'New Project', status: 'draft' as const };

      store.createProject(createData).subscribe((project) => {
        expect(project.name).toBe('New Project');
        expect(store.projects()).toContain(project);
        expect(toastMock.success).toHaveBeenCalledWith('Project created successfully');
      });

      const req = httpMock.expectOne(API_CONFIG.PROJECTS.CREATE);
      expect(req.request.method).toBe('POST');
      req.flush({ ...mockProject, ...createData });
    });

    it('should show error toast on failure', () => {
      store.createProject({ name: 'Fail' }).subscribe({
        error: () => {
          expect(toastMock.error).toHaveBeenCalledWith('Failed to create project');
        },
      });

      const req = httpMock.expectOne(API_CONFIG.PROJECTS.CREATE);
      req.flush({ message: 'Error' }, { status: 400, statusText: 'Bad Request' });
    });
  });

  describe('updateProject', () => {
    it('should update a project and show success toast', () => {
      const updateData = { name: 'Updated Project' };

      store.updateProject('project-1', updateData).subscribe((project) => {
        expect(project.name).toBe('Updated Project');
        expect(toastMock.success).toHaveBeenCalledWith('Project updated successfully');
      });

      const req = httpMock.expectOne(API_CONFIG.PROJECTS.UPDATE('project-1'));
      expect(req.request.method).toBe('PATCH');
      req.flush({ ...mockProject, ...updateData });
    });
  });

  describe('deleteProject', () => {
    it('should delete a project and show success toast', () => {
      store.deleteProject('project-1').subscribe(() => {
        expect(store.projects().filter((p) => p._id === 'project-1')).toHaveLength(0);
        expect(toastMock.success).toHaveBeenCalledWith('Project deleted successfully');
      });

      const req = httpMock.expectOne(API_CONFIG.PROJECTS.DELETE('project-1'));
      expect(req.request.method).toBe('DELETE');
      req.flush({ success: true });
    });
  });
});
