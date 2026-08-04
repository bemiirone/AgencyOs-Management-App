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
          callbacks.next({ _id: 'new-project-1', name: 'New Project' }),
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
      expect(component.form.name).toBe('');
      expect(component.form.description).toBe('');
      expect(component.form.status).toBe('draft');
      expect(component.form.clientId).toBe('');
      expect(component.form.startDate).toBe('');
      expect(component.form.endDate).toBe('');
      expect(component.form.budget).toBe(0);
    });
  });

  describe('Submit - Success', () => {
    it('should call createProject with minimal fields', () => {
      component.form.name = 'Test Project';
      component.onSubmit();

      expect(projectStoreMock.createProject).toHaveBeenCalledWith({
        name: 'Test Project',
        description: '',
        status: 'draft',
      });
    });

    it('should include optional fields when provided', () => {
      component.form.name = 'Full Project';
      component.form.description = 'A description';
      component.form.status = 'active';
      component.form.clientId = 'client-1';
      component.form.startDate = '2024-01-01';
      component.form.endDate = '2024-06-01';
      component.form.budget = 5000;

      component.onSubmit();

      expect(projectStoreMock.createProject).toHaveBeenCalledWith({
        name: 'Full Project',
        description: 'A description',
        status: 'active',
        clientId: 'client-1',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-06-01'),
        budget: 5000,
      });
    });

    it('should navigate to project detail on success', () => {
      component.form.name = 'Test Project';
      component.onSubmit();

      expect(routerMock.navigate).toHaveBeenCalledWith(['/projects', 'new-project-1'], { queryParamsHandling: 'preserve' });
    });

    it('should set saving to false on success', () => {
      component.form.name = 'Test Project';
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
      component.form.name = 'Test Project';
      component.onSubmit();

      expect(component.error()).toBe('Duplicate name');
      expect(component.saving()).toBe(false);
    });

    it('should set generic error message when no message provided', () => {
      projectStoreMock.createProject = vi.fn().mockReturnValue({
        subscribe: (callbacks: any) => callbacks.error({}),
      });
      component.form.name = 'Test Project';
      component.onSubmit();

      expect(component.error()).toBe('Failed to create project');
    });

    it('should clear previous error before submitting', () => {
      component.error.set('Previous error');
      component.form.name = 'Test Project';
      component.onSubmit();

      expect(component.error()).toBe('');
    });
  });

  describe('Form Validation Edge Cases', () => {
    it('should not include clientId when empty', () => {
      component.form.name = 'Test Project';
      component.form.clientId = '';
      component.onSubmit();

      const callArg = projectStoreMock.createProject.mock.calls[0][0];
      expect(callArg.clientId).toBeUndefined();
    });

    it('should not include startDate when empty', () => {
      component.form.name = 'Test Project';
      component.form.startDate = '';
      component.onSubmit();

      const callArg = projectStoreMock.createProject.mock.calls[0][0];
      expect(callArg.startDate).toBeUndefined();
    });

    it('should not include endDate when empty', () => {
      component.form.name = 'Test Project';
      component.form.endDate = '';
      component.onSubmit();

      const callArg = projectStoreMock.createProject.mock.calls[0][0];
      expect(callArg.endDate).toBeUndefined();
    });

    it('should not include budget when zero', () => {
      component.form.name = 'Test Project';
      component.form.budget = 0;
      component.onSubmit();

      const callArg = projectStoreMock.createProject.mock.calls[0][0];
      expect(callArg.budget).toBeUndefined();
    });
  });
});
