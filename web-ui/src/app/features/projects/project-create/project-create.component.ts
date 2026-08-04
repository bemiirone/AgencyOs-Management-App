import { Component, signal, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faArrowLeft, faSpinner, faSave } from '@fortawesome/free-solid-svg-icons';
import { ProjectStore } from '../../../stores/project.store';
import { CreateProjectPayload, ProjectStatus } from '../project.models';

@Component({
  selector: 'app-project-create',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FontAwesomeModule],
  templateUrl: './project-create.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectCreateComponent {
  private readonly projectStore = inject(ProjectStore);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);

  readonly saving = signal(false);
  readonly error = signal('');

  readonly faArrowLeft = faArrowLeft;
  readonly faSpinner = faSpinner;
  readonly faSave = faSave;

  projectForm: FormGroup = this.fb.group({
    name: ['', Validators.required],
    description: [''],
    status: ['draft'],
    clientId: [''],
    clientName: ['', Validators.required],
    clientEmail: ['', [Validators.required, Validators.email]],
    startDate: [''],
    endDate: [''],
    budget: [0],
  });

  get nameControl() { return this.projectForm.get('name'); }
  get clientNameControl() { return this.projectForm.get('clientName'); }
  get clientEmailControl() { return this.projectForm.get('clientEmail'); }

  onSubmit(): void {
    if (this.projectForm.invalid) return;

    this.saving.set(true);
    this.error.set('');

    const formValue = this.projectForm.value;

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
  }
}
