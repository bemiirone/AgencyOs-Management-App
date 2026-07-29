import { Component, inject, signal, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import {
  faArrowLeft,
  faCalendar,
  faFlag,
  faSpinner,
  faEdit,
  faSave,
  faTimes,
} from '@fortawesome/free-solid-svg-icons';
import { Task } from '../../../shared/models/task.model';
import { TaskStore } from '../../../stores/task.store';
import { ProjectStore } from '../../../stores/project.store';

@Component({
  selector: 'app-task-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, FontAwesomeModule],
  templateUrl: './task-detail.component.html',
  styleUrl: './task-detail.component.scss',
})
export class TaskDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private taskStore = inject(TaskStore);
  private projectStore = inject(ProjectStore);

  task = signal<Task | null>(null);
  projects = signal<any[]>([]);
  loading = signal(false);
  editing = signal(false);

  faArrowLeft = faArrowLeft;
  faCalendar = faCalendar;
  faFlag = faFlag;
  faSpinner = faSpinner;
  faEdit = faEdit;
  faSave = faSave;
  faTimes = faTimes;

  editForm = {
    title: '',
    description: '',
    status: 'todo' as Task['status'],
    priority: 'medium' as Task['priority'],
    dueDate: '',
  };

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadTask(id);
    }
    this.projectStore.loadProjects().subscribe({
      next: (projects) => this.projects.set(projects),
      error: () => {},
    });
  }

  loadTask(id: string): void {
    this.loading.set(true);
    this.taskStore.loadTask(id).subscribe({
      next: (task) => {
        this.task.set(task);
        this.editForm = {
          title: task.title,
          description: task.description || '',
          status: task.status,
          priority: task.priority,
          dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '',
        };
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  toggleEdit(): void {
    this.editing.update((v) => !v);
  }

  saveTask(): void {
    const id = this.task()?._id;
    if (!id) return;

    this.taskStore.updateTask(id, this.editForm).subscribe({
      next: (task) => {
        this.task.set(task);
        this.editing.set(false);
      },
      error: () => {},
    });
  }

  cancelEdit(): void {
    const t = this.task();
    if (t) {
      this.editForm = {
        title: t.title,
        description: t.description || '',
        status: t.status,
        priority: t.priority,
        dueDate: t.dueDate ? new Date(t.dueDate).toISOString().split('T')[0] : '',
      };
    }
    this.editing.set(false);
  }

  formatDate(date: string | Date | undefined): string {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString();
  }

  getProjectName(projectId: string): string {
    const project = this.projects().find((p) => p._id === projectId);
    return project?.name || 'Unknown';
  }

  getStatusBadgeClass(status: string): string {
    const classes: Record<string, string> = {
      todo: 'badge-ghost',
      in_progress: 'badge-warning',
      in_review: 'badge-info',
      done: 'badge-success',
    };
    return classes[status] || 'badge-ghost';
  }

  getPriorityBadgeClass(priority: string): string {
    const classes: Record<string, string> = {
      low: 'badge-ghost',
      medium: 'badge-info',
      high: 'badge-warning',
      urgent: 'badge-error',
    };
    return classes[priority] || 'badge-ghost';
  }

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      todo: 'To Do',
      in_progress: 'In Progress',
      in_review: 'In Review',
      done: 'Done',
    };
    return labels[status] || status;
  }

  getPriorityLabel(priority: string): string {
    const labels: Record<string, string> = {
      low: 'Low',
      medium: 'Medium',
      high: 'High',
      urgent: 'Urgent',
    };
    return labels[priority] || priority;
  }
}
