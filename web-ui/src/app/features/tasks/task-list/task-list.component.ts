import { Component, signal, OnInit, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import {
  faPlus,
  faEye,
  faEdit,
  faTrash,
  faSearch,
  faSpinner,
  faFilter,
} from '@fortawesome/free-solid-svg-icons';
import { Task } from '../../../shared/models/task.model';
import { Project } from '../../../shared/models/project.model';
import { TaskStore } from '../../../stores/task.store';
import { ProjectStore } from '../../../stores/project.store';
import { UserStore } from '../../../stores/user.store';

@Component({
  selector: 'app-task-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, FontAwesomeModule],
  templateUrl: './task-list.component.html',
  styleUrl: './task-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaskListComponent implements OnInit {
  private readonly taskStore = inject(TaskStore);
  private readonly projectStore = inject(ProjectStore);
  readonly userStore = inject(UserStore);
  readonly Math = Math;

  readonly tasks = signal<Task[]>([]);
  readonly projects = signal<Project[]>([]);
  readonly loading = signal(false);
  readonly searchQuery = signal('');
  readonly statusFilter = signal<string>('');
  readonly priorityFilter = signal<string>('');
  readonly projectFilter = signal<string>('');
  readonly assigneeFilter = signal<string>('');
  readonly currentPage = signal(1);
  readonly pageSize = 10;

  readonly faPlus = faPlus;
  readonly faEye = faEye;
  readonly faEdit = faEdit;
  readonly faTrash = faTrash;
  readonly faSearch = faSearch;
  readonly faSpinner = faSpinner;
  readonly faFilter = faFilter;

  ngOnInit(): void {
    this.loadTasks();
    this.projectStore.loadProjects().subscribe({
      next: (response) => this.projects.set(response.data),
      error: (err) => console.error('Failed to load projects:', err),
    });
  }

  loadTasks(): void {
    this.loading.set(true);
    this.taskStore.loadAllTasks().subscribe({
      next: (response) => {
        this.tasks.set(response.data);
        this.currentPage.set(1);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  onFilterChange(): void {
    this.currentPage.set(1);
  }

  onPageChange(page: number): void {
    if (page >= 1 && page <= this.filteredTotalPages) {
      this.currentPage.set(page);
    }
  }

  get filteredTasks(): Task[] {
    let result = this.tasks();
    const query = this.searchQuery().toLowerCase();
    const status = this.statusFilter();
    const priority = this.priorityFilter();
    const project = this.projectFilter();
    const assignee = this.assigneeFilter();

    if (query) {
      result = result.filter(
        (t) =>
          t.title.toLowerCase().includes(query) ||
          (t.description && t.description.toLowerCase().includes(query))
      );
    }

    if (status) {
      result = result.filter((t) => t.status === status);
    }

    if (priority) {
      result = result.filter((t) => t.priority === priority);
    }

    if (project) {
      result = result.filter((t) => t.projectId === project);
    }

    if (assignee) {
      result = result.filter((t) => t.assigneeIds?.includes(assignee));
    }

    return result;
  }

  get filteredTotalPages(): number {
    return Math.ceil(this.filteredTasks.length / this.pageSize);
  }

  get paginatedTasks(): Task[] {
    const start = (this.currentPage() - 1) * this.pageSize;
    return this.filteredTasks.slice(start, start + this.pageSize);
  }

  get pages(): number[] {
    const pages: number[] = [];
    const maxVisible = 5;
    const current = this.currentPage();
    const total = this.filteredTotalPages;

    if (total <= maxVisible) {
      for (let i = 1; i <= total; i++) {
        pages.push(i);
      }
    } else {
      const start = Math.max(1, current - 2);
      const end = Math.min(total, start + maxVisible - 1);
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
    }

    return pages;
  }

  getProjectName(projectId: string): string {
    const project = this.projects().find((p) => p._id === projectId);
    return project?.name || 'Unknown';
  }

  formatDate(date: string | Date | undefined): string {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString();
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

  getUserName(userId: string, fallback: string = 'Unknown'): string {
    if (!userId) return fallback;
    const user = this.userStore.users().find((u) => u.id === userId);
    return user?.name || fallback;
  }

  getAssigneeName(task: Task): string {
    const assigneeId = task.assigneeIds?.[0];
    if (!assigneeId) return 'Unassigned';
    return this.getUserName(assigneeId, 'Unassigned');
  }

  getAssigneeId(task: Task): string {
    return task.assigneeIds?.[0] || '';
  }

  getCreatorName(task: Task): string {
    if (!task.createdBy) return 'Unknown';
    return this.getUserName(task.createdBy);
  }

  getCreatorId(task: Task): string {
    return task.createdBy || '';
  }

  getInitials(name: string): string {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }

  getAvatarColor(name: string): string {
    const colors = [
      'bg-primary',
      'bg-secondary',
      'bg-accent',
      'bg-info',
      'bg-success',
      'bg-warning',
      'bg-error',
    ];
    const index = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length;
    return colors[index];
  }

  getAvatarColorById(userId: string): string {
    const colors = [
      'bg-primary',
      'bg-secondary',
      'bg-accent',
      'bg-info',
      'bg-success',
      'bg-warning',
      'bg-error',
    ];
    const index = userId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length;
    return colors[index];
  }
}
