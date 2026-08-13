import { Component, signal, inject, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faArrowLeft, faSpinner, faSave } from '@fortawesome/free-solid-svg-icons';
import { ProjectStore } from '../../../stores/project.store';
import { ToastService } from '../../../core/services/toast.service';
import { Project } from '../../../shared/models/project.model';
import { CreateProjectPayload, UpdateProjectPayload } from '../project.models';
import { API_CONFIG } from '../../../core/config/api.config';

@Component({
  selector: 'app-project-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, FontAwesomeModule],
  templateUrl: './project-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectFormComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly projectStore = inject(ProjectStore);
  private readonly toast = inject(ToastService);
  private readonly http = inject(HttpClient);
  private readonly fb = inject(FormBuilder);

  readonly mode = signal<'create' | 'edit'>('create');
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly error = signal('');
  readonly projectId = signal('');

  readonly faArrowLeft = faArrowLeft;
  readonly faSpinner = faSpinner;
  readonly faSave = faSave;

  projectForm: FormGroup = this.fb.group({
    name: ['', Validators.required],
    description: [''],
    status: ['draft'],
    clientId: [''],
    clientName: [''],
    clientEmail: ['', Validators.email],
    startDate: [''],
    endDate: [''],
    budget: [0],
  });

  get nameControl() { return this.projectForm.get('name'); }
  get clientNameControl() { return this.projectForm.get('clientName'); }
  get clientEmailControl() { return this.projectForm.get('clientEmail'); }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');

    if (id) {
      this.mode.set('edit');
      this.projectId.set(id);
      this.loading.set(true);

      this.projectStore.loadProject(id).subscribe({
        next: (project: Project) => {
          this.projectForm.patchValue({
            name: project.name,
            description: project.description || '',
            status: project.status,
            clientId: project.clientId || '',
            clientName: project.clientName || '',
            clientEmail: project.clientEmail || '',
            startDate: project.startDate ? new Date(project.startDate).toISOString().split('T')[0] : '',
            endDate: project.endDate ? new Date(project.endDate).toISOString().split('T')[0] : '',
            budget: project.budget || 0,
          });
          this.setupValidation();
          this.loading.set(false);
        },
        error: () => {
          this.error.set('Failed to load project');
          this.loading.set(false);
        },
      });
    } else {
      this.mode.set('create');
      this.setupValidation();
    }
  }

  private setupValidation(): void {
    if (this.mode() === 'create') {
      this.projectForm.get('clientName')?.setValidators([Validators.required]);
      this.projectForm.get('clientEmail')?.setValidators([Validators.required, Validators.email]);
    } else {
      this.projectForm.get('clientName')?.clearValidators();
      this.projectForm.get('clientEmail')?.setValidators([Validators.email]);
    }
    this.projectForm.get('clientName')?.updateValueAndValidity();
    this.projectForm.get('clientEmail')?.updateValueAndValidity();
  }

  async onSubmit(): Promise<void> {
    if (this.projectForm.invalid) return;

    if (this.mode() === 'edit' && this.projectForm.get('status')?.value === 'completed') {
      const canComplete = await this.validateProjectCompletion();
      if (!canComplete) return;
    }

    this.saving.set(true);
    this.error.set('');

    const formValue = this.projectForm.value;

    if (this.mode() === 'create') {
      const projectData: CreateProjectPayload = {
        name: formValue.name,
        description: formValue.description,
        status: formValue.status,
        clientName: formValue.clientName,
        clientEmail: formValue.clientEmail,
      };

      if (formValue.clientId) projectData.clientId = formValue.clientId;
      if (formValue.startDate) projectData.startDate = new Date(formValue.startDate);
      if (formValue.endDate) projectData.endDate = new Date(formValue.endDate);
      if (formValue.budget) projectData.budget = formValue.budget;

      this.projectStore.createProject(projectData).subscribe({
        next: (project) => {
          this.saving.set(false);
          this.router.navigate(['/projects', project._id], { queryParamsHandling: 'preserve' });
        },
        error: (err) => {
          this.error.set(err.error?.message || 'Failed to create project');
          this.saving.set(false);
        },
      });
    } else {
      const id = this.projectId();
      const projectData: UpdateProjectPayload = {
        name: formValue.name,
        description: formValue.description,
        status: formValue.status,
      };

      if (formValue.clientName) projectData.clientName = formValue.clientName;
      if (formValue.clientEmail) projectData.clientEmail = formValue.clientEmail;
      if (formValue.clientId) projectData.clientId = formValue.clientId;
      if (formValue.startDate) projectData.startDate = new Date(formValue.startDate);
      if (formValue.endDate) projectData.endDate = new Date(formValue.endDate);
      if (formValue.budget) projectData.budget = formValue.budget;

      this.projectStore.updateProject(id, projectData).subscribe({
        next: (project) => {
          this.saving.set(false);
          this.router.navigate(['/projects', project._id], { queryParamsHandling: 'preserve' });
        },
        error: (err) => {
          this.error.set(err.error?.message || 'Failed to update project');
          this.saving.set(false);
        },
      });
    }
  }

  private async validateProjectCompletion(): Promise<boolean> {
    try {
      const projectId = this.projectId();
      const response: any = await firstValueFrom(
        this.http.get(API_CONFIG.TASKS.BY_PROJECT(projectId)),
      );

      const tasks = response.data || response;
      const incompleteTasks = tasks.filter((task: any) => task.status !== 'done');

      if (incompleteTasks.length > 0) {
        const message = `Cannot complete project: ${incompleteTasks.length} task(s) are still incomplete`;
        this.error.set(message);
        this.toast.error(message);
        return false;
      }

      return true;
    } catch (err) {
      console.error('Failed to validate project completion:', err);
      return true;
    }
  }
}
