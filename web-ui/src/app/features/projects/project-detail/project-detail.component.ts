import { Component, inject, signal, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faArrowLeft, faCalendar, faUser, faDollarSign, faClock, faSpinner, faEdit, faTasks, faCheckCircle, faHourglassHalf, faTrash, faPlay } from '@fortawesome/free-solid-svg-icons';
import { Project } from '../../../shared/models/project.model';
import { ProjectStore } from '../../../stores/project.store';
import { TaskStore } from '../../../stores/task.store';
import { TimeEntryStore } from '../../../stores/time-entry.store';
import { Task } from '../../../shared/models/task.model';
import { TimeEntry } from '../../../shared/models/time-entry.model';

@Component({
  selector: 'app-project-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, FontAwesomeModule],
  templateUrl: './project-detail.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrls: ['./project-detail.component.scss'],
})
export class ProjectDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly projectStore = inject(ProjectStore);
  private readonly taskStore = inject(TaskStore);
  readonly timeEntryStore = inject(TimeEntryStore);

  readonly project = signal<Project | null>(null);
  readonly tasks = signal<Task[]>([]);
  readonly timeEntries = signal<TimeEntry[]>([]);
  readonly loading = signal(false);

  readonly faArrowLeft = faArrowLeft;
  readonly faCalendar = faCalendar;
  readonly faUser = faUser;
  readonly faDollarSign = faDollarSign;
  readonly faClock = faClock;
  readonly faSpinner = faSpinner;
  readonly faEdit = faEdit;
  readonly faTasks = faTasks;
  readonly faCheckCircle = faCheckCircle;
  readonly faHourglassHalf = faHourglassHalf;
  readonly faTrash = faTrash;
  readonly faPlay = faPlay;

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadProject(id);
    }
  }

  loadProject(id: string): void {
    this.loading.set(true);
    this.projectStore.loadProject(id).subscribe({
      next: (project: Project) => {
        this.project.set(project);
        this.loadProjectData(id);
      },
      error: () => this.loading.set(false),
    });
  }

  private loadProjectData(projectId: string): void {
    this.taskStore.loadTasksByProject(projectId).subscribe({
      next: (tasks) => {
        this.tasks.set(tasks);
        this.checkLoadingComplete();
      },
      error: () => this.checkLoadingComplete(),
    });

    this.timeEntryStore.loadEntriesByProject(projectId).subscribe({
      next: (entries) => {
        this.timeEntries.set(entries);
        this.checkLoadingComplete();
      },
      error: () => this.checkLoadingComplete(),
    });
  }

  private checkLoadingComplete(): void {
    this.loading.set(false);
  }

  formatDate(date: string | Date | undefined): string {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString();
  }

  formatCurrency(amount: number | undefined): string {
    if (!amount) return '$0';
    return `$${amount.toLocaleString()}`;
  }

  getStatusClass(status: string): string {
    const classes: Record<string, string> = {
      active: 'badge-success',
      draft: 'badge-ghost',
      on_hold: 'badge-warning',
      completed: 'badge-info',
      archived: 'badge-neutral',
    };
    return classes[status] || 'badge-ghost';
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

  getTaskStatusClass(status: string): string {
    const classes: Record<string, string> = {
      todo: 'badge-ghost',
      in_progress: 'badge-warning',
      in_review: 'badge-info',
      done: 'badge-success',
    };
    return classes[status] || 'badge-ghost';
  }

  getTaskStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      todo: 'To Do',
      in_progress: 'In Progress',
      in_review: 'In Review',
      done: 'Done',
    };
    return labels[status] || status;
  }

  getTaskPriorityClass(priority: string): string {
    const classes: Record<string, string> = {
      low: 'text-base-content/40',
      medium: 'text-info',
      high: 'text-warning',
      urgent: 'text-error',
    };
    return classes[priority] || 'text-base-content/40';
  }

  deleteProject(): void {
    const id = this.project()?._id;
    if (!id) return;
    
    if (confirm('Are you sure you want to delete this project?')) {
      this.projectStore.deleteProject(id).subscribe({
        next: () => {
          this.router.navigate(['/projects']);
        },
        error: (err) => console.error('Failed to delete project:', err),
      });
    }
  }

  deleteTask(id: string): void {
    if (confirm('Are you sure you want to delete this task?')) {
      this.taskStore.deleteTask(id).subscribe({
        next: () => {
          this.tasks.update((tasks) => tasks.filter((t) => t._id !== id));
        },
        error: (err) => console.error('Failed to delete task:', err),
      });
    }
  }

  getTotalTimeSeconds(): number {
    return this.timeEntries().reduce((sum, e) => sum + (e.duration || 0), 0);
  }

  getTotalTimeFormatted(): string {
    const totalSeconds = this.getTotalTimeSeconds();
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  }

  getTaskTimeEntries(taskId: string): TimeEntry[] {
    return this.timeEntries().filter((e) => e.taskId === taskId).slice(0, 3);
  }
}
