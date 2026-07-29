import { Component, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faArrowLeft, faSpinner, faSave } from '@fortawesome/free-solid-svg-icons';
import { ProjectStore } from '../../../stores/project.store';
import { Project } from '../../../shared/models/project.model';

@Component({
  selector: 'app-project-edit',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, FontAwesomeModule],
  templateUrl: './project-edit.component.html',
})
export class ProjectEditComponent implements OnInit {
  loading = signal(true);
  saving = signal(false);
  error = signal('');
  projectId = signal('');
  dataLoaded = signal(false);

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

  constructor(
    private route: ActivatedRoute,
    private projectStore: ProjectStore,
    private router: Router,
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.loading.set(false);
      return;
    }

    this.projectId.set(id);

    this.projectStore.loadProject(id).subscribe({
      next: (project: Project) => {
        this.form.name = project.name;
        this.form.description = project.description || '';
        this.form.status = project.status;
        this.form.clientId = project.clientId || '';
        this.form.startDate = project.startDate ? new Date(project.startDate).toISOString().split('T')[0] : '';
        this.form.endDate = project.endDate ? new Date(project.endDate).toISOString().split('T')[0] : '';
        this.form.budget = project.budget || 0;
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
    const id = this.projectId();
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

    this.projectStore.updateProject(id, projectData).subscribe({
      next: (project) => {
        this.saving.set(false);
        this.router.navigate(['/projects', project._id]);
      },
      error: (err) => {
        this.error.set(err.error?.message || 'Failed to update project');
        this.saving.set(false);
      },
    });
  }
}
