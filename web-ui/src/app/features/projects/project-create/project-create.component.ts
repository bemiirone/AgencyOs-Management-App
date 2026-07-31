import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faArrowLeft, faSpinner, faSave } from '@fortawesome/free-solid-svg-icons';
import { ProjectStore } from '../../../stores/project.store';

@Component({
  selector: 'app-project-create',
  standalone: true,
  imports: [CommonModule, FormsModule, FontAwesomeModule],
  templateUrl: './project-create.component.html',
})
export class ProjectCreateComponent {
  private projectStore = inject(ProjectStore);
  private router = inject(Router);

  saving = signal(false);
  error = signal('');

  faArrowLeft = faArrowLeft;
  faSpinner = faSpinner;
  faSave = faSave;

  form = {
    name: '',
    description: '',
    status: 'draft',
    clientId: '',
    startDate: '',
    endDate: '',
    budget: 0,
  };

  onSubmit(): void {
    this.saving.set(true);
    this.error.set('');

    const projectData: any = {
      name: this.form.name,
      description: this.form.description,
      status: this.form.status,
    };

    if (this.form.clientId) projectData.clientId = this.form.clientId;
    if (this.form.startDate) projectData.startDate = new Date(this.form.startDate);
    if (this.form.endDate) projectData.endDate = new Date(this.form.endDate);
    if (this.form.budget) projectData.budget = this.form.budget;

    this.projectStore.createProject(projectData).subscribe({
      next: (project) => {
        this.saving.set(false);
        this.router.navigate(['/projects', project._id]);
      },
      error: (err) => {
        this.error.set(err.error?.message || 'Failed to create project');
        this.saving.set(false);
      },
    });
  }
}
