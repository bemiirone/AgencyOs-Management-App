import { Component, signal, OnInit, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faPlus, faEye, faEdit, faTrash, faSearch, faSpinner } from '@fortawesome/free-solid-svg-icons';
import { Project } from '../../../shared/models/project.model';
import { ProjectStore } from '../../../stores/project.store';

@Component({
  selector: 'app-project-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, FontAwesomeModule],
  templateUrl: './project-list.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrls: ['./project-list.component.scss'],
})
export class ProjectListComponent implements OnInit {
  private readonly projectStore = inject(ProjectStore);
  
  readonly projects = signal<Project[]>([]);
  readonly loading = signal(false);
  readonly searchQuery = signal('');

  readonly faPlus = faPlus;
  readonly faEye = faEye;
  readonly faEdit = faEdit;
  readonly faTrash = faTrash;
  readonly faSearch = faSearch;
  readonly faSpinner = faSpinner;

  ngOnInit(): void {
    this.loadProjects();
  }

  loadProjects(): void {
    this.loading.set(true);
    this.projectStore.loadProjects().subscribe({
      next: (projects: Project[]) => {
        this.projects.set(projects);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  get filteredProjects(): Project[] {
    const query = this.searchQuery().toLowerCase();
    if (!query) return this.projects();
    return this.projects().filter(
      (p) =>
        p.name.toLowerCase().includes(query) ||
        (p.description && p.description.toLowerCase().includes(query))
    );
  }

  formatDate(date: string | Date | undefined): string {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString();
  }

  formatCurrency(amount: number | undefined): string {
    if (!amount) return '£0';
    return `£${amount.toLocaleString()}`;
  }

  getStatusColor(status: string): string {
    const colors: Record<string, string> = {
      active: 'badge-success',
      draft: 'badge-ghost',
      on_hold: 'badge-warning',
      completed: 'badge-info',
      archived: 'badge-neutral',
    };
    return colors[status] || 'badge-ghost';
  }

  getStatusClass(status: string): string {
    return this.getStatusColor(status);
  }

  getProjectStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      draft: 'Draft',
      active: 'Active',
      on_hold: 'On Hold',
      completed: 'Completed',
      archived: 'Archived',
    };
    return labels[status] || status;
  }

  deleteProject(id: string): void {
    if (confirm('Are you sure you want to delete this project?')) {
      this.projectStore.deleteProject(id).subscribe({
        next: () => {
          this.projects.update((projects) => projects.filter((p) => p._id !== id));
        },
        error: (err) => console.error('Failed to delete project:', err),
      });
    }
  }
}
