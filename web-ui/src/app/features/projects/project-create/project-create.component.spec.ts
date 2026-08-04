import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { ProjectCreateComponent } from './project-create.component';
import { ProjectStore } from '../../../stores/project.store';
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('ProjectCreateComponent', () => {
  let component: ProjectCreateComponent;
  let fixture: ComponentFixture<ProjectCreateComponent>;
  let projectStoreMock: any;
  let routerMock: any;

  beforeEach(async () => {
    routerMock = {
      navigate: vi.fn(),
    };

    projectStoreMock = {
      createProject: vi.fn().mockReturnValue({
        subscribe: (callbacks: any) =>
          callbacks.next({ _id: 'new-project-1', name: 'New Project', clientName: 'Test Client', clientEmail: 'test@example.com' }),
      }),
    };

    await TestBed.configureTestingModule({
      imports: [ProjectCreateComponent],
      providers: [
        provideHttpClient(),
        { provide: Router, useValue: routerMock },
        { provide: ProjectStore, useValue: projectStoreMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ProjectCreateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  describe('Component Initialization', () => {
    it('should create the component', () => {
      expect(component).toBeTruthy();
    });

    it('should initialize with default form values', () => {
      expect(component.projectForm.get('name')?.value).toBe('');
      expect(component.projectForm.get('description')?.value).toBe('');
      expect(component.projectForm.get('status')?.value).toBe('draft');
      expect(component.projectForm.get('clientId')?.value).toBe('');
      expect(component.projectForm.get('clientName')?.value).toBe('');
      expect(component.projectForm.get('clientEmail')?.value).toBe('');
      expect(component.projectForm.get('startDate')?.value).toBe('');
      expect(component.projectForm.get('endDate')?.value).toBe('');
      expect(component.projectForm.get('budget')?.value).toBe(0);
    });
  });

  describe('Submit - Success', () => {
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

    it('should navigate to project detail on success', () => {
      component.projectForm.patchValue({
        name: 'Test Project',
        clientName: 'Test Client',
        clientEmail: 'test@example.com',
      });
      component.onSubmit();

      expect(routerMock.navigate).toHaveBeenCalledWith(['/projects', 'new-project-1'], { queryParamsHandling: 'preserve' });
    });

    it('should set saving to false on success', () => {
      component.projectForm.patchValue({
        name: 'Test Project',
        clientName: 'Test Client',
        clientEmail: 'test@example.com',
      });
      component.onSubmit();

      expect(component.saving()).toBe(false);
    });
  });

  describe('Submit - Error', () => {
    it('should set error message on failure', () => {
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
      expect(component.saving()).toBe(false);
    });

    it('should set generic error message when no message provided', () => {
      projectStoreMock.createProject = vi.fn().mockReturnValue({
        subscribe: (callbacks: any) => callbacks.error({}),
      });
      component.projectForm.patchValue({
        name: 'Test Project',
        clientName: 'Test Client',
        clientEmail: 'test@example.com',
      });
      component.onSubmit();

      expect(component.error()).toBe('Failed to create project');
    });

    it('should clear previous error before submitting', () => {
      component.error.set('Previous error');
      component.projectForm.patchValue({
        name: 'Test Project',
        clientName: 'Test Client',
        clientEmail: 'test@example.com',
      });
      component.onSubmit();

      expect(component.error()).toBe('');
    });
  });

  describe('Form Validation Edge Cases', () => {
    it('should not include clientId when empty', () => {
      component.projectForm.patchValue({
        name: 'Test Project',
        clientName: 'Test Client',
        clientEmail: 'test@example.com',
        clientId: '',
      });
      component.onSubmit();

      const callArg = projectStoreMock.createProject.mock.calls[0][0];
      expect(callArg.clientId).toBeUndefined();
    });

    it('should not include startDate when empty', () => {
      component.projectForm.patchValue({
        name: 'Test Project',
        clientName: 'Test Client',
        clientEmail: 'test@example.com',
        startDate: '',
      });
      component.onSubmit();

      const callArg = projectStoreMock.createProject.mock.calls[0][0];
      expect(callArg.startDate).toBeUndefined();
    });

    it('should not include endDate when empty', () => {
      component.projectForm.patchValue({
        name: 'Test Project',
        clientName: 'Test Client',
        clientEmail: 'test@example.com',
        endDate: '',
      });
      component.onSubmit();

      const callArg = projectStoreMock.createProject.mock.calls[0][0];
      expect(callArg.endDate).toBeUndefined();
    });

    it('should not include budget when zero', () => {
      component.projectForm.patchValue({
        name: 'Test Project',
        clientName: 'Test Client',
        clientEmail: 'test@example.com',
        budget: 0,
      });
      component.onSubmit();

      const callArg = projectStoreMock.createProject.mock.calls[0][0];
      expect(callArg.budget).toBeUndefined();
    });

    it('should be invalid when name is empty', () => {
      component.projectForm.patchValue({
        name: '',
        clientName: 'Test Client',
        clientEmail: 'test@example.com',
      });
      expect(component.projectForm.invalid).toBe(true);
    });

    it('should be invalid when clientName is empty', () => {
      component.projectForm.patchValue({
        name: 'Test Project',
        clientName: '',
        clientEmail: 'test@example.com',
      });
      expect(component.projectForm.invalid).toBe(true);
    });

    it('should be invalid when clientEmail is empty', () => {
      component.projectForm.patchValue({
        name: 'Test Project',
        clientName: 'Test Client',
        clientEmail: '',
      });
      expect(component.projectForm.invalid).toBe(true);
    });

    it('should be invalid when clientEmail is invalid', () => {
      component.projectForm.patchValue({
        name: 'Test Project',
        clientName: 'Test Client',
        clientEmail: 'not-an-email',
      });
      expect(component.projectForm.invalid).toBe(true);
    });

    it('should not submit when form is invalid', () => {
      component.projectForm.patchValue({
        name: '',
        clientName: '',
        clientEmail: '',
      });
      component.onSubmit();

      expect(projectStoreMock.createProject).not.toHaveBeenCalled();
    });
  });
});
