import { Component, signal, OnInit, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faArrowLeft, faSpinner, faSave } from '@fortawesome/free-solid-svg-icons';
import { ProjectStore } from '../../../stores/project.store';
import { Project } from '../../../shared/models/project.model';
import { UpdateProjectPayload, ProjectStatus } from '../project.models';

@Component({
  selector: 'app-project-edit',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, FontAwesomeModule],
  templateUrl: './project-edit.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectEditComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly projectStore = inject(ProjectStore);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);

  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly error = signal('');
  readonly projectId = signal('');
  readonly dataLoaded = signal(false);

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
    if (!id) {
      this.loading.set(false);
      return;
    }

    this.projectId.set(id);

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
        this.dataLoaded.set(true);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Failed to load project');
        this.loading.set(false);
      },
    });
  }

  onSubmit(): void {
    if (this.projectForm.invalid) return;

    const id = this.projectId();
    this.saving.set(true);
    this.error.set('');

    const formValue = this.projectForm.value;

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
