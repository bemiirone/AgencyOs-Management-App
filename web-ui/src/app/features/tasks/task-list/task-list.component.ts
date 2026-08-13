import { Component, signal, OnInit, inject, ViewChild, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import {
  faPlus,
  faEdit,
  faTrash,
  faSpinner,
  faFilter,
} from '@fortawesome/free-solid-svg-icons';
import { Task } from '../../../shared/models/task.model';
import { Project } from '../../../shared/models/project.model';
import { TaskStore } from '../../../stores/task.store';
import { ProjectStore } from '../../../stores/project.store';
import { UserStore } from '../../../stores/user.store';
import { SearchCardComponent } from '../../../shared/components/search-card/search-card.component';
import { ContentCardComponent } from '../../../shared/components/content-card/content-card.component';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-task-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, FontAwesomeModule, SearchCardComponent, ContentCardComponent, ConfirmDialogComponent],
  templateUrl: './task-list.component.html',
  styleUrl: './task-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaskListComponent implements OnInit {
  private readonly taskStore = inject(TaskStore);
  private readonly projectStore = inject(ProjectStore);
  readonly userStore = inject(UserStore);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  readonly Math = Math;

  @ViewChild('deleteTaskDialog') deleteTaskDialog!: ConfirmDialogComponent;

  readonly tasks = signal<Task[]>([]);
  readonly projects = signal<Project[]>([]);
  readonly loading = signal(false);
  readonly searchQuery = signal('');
  readonly statusFilter = signal<string>('');
  readonly priorityFilter = signal<string>('');
  readonly projectFilter = signal<string>('');
  readonly assigneeFilter = signal<string>('');
  readonly currentPage = signal(1);
  readonly pendingDeleteTaskId = signal('');
  readonly pageSize = 10;

  readonly faPlus = faPlus;
  readonly faEdit = faEdit;
  readonly faTrash = faTrash;
  readonly faSpinner = faSpinner;
  readonly faFilter = faFilter;

  ngOnInit(): void {
    const queryParams = this.route.snapshot.queryParams;
    this.searchQuery.set(queryParams['search'] || '');
    this.statusFilter.set(queryParams['status'] || '');
    this.priorityFilter.set(queryParams['priority'] || '');
    this.projectFilter.set(queryParams['project'] || '');
    this.assigneeFilter.set(queryParams['assignee'] || '');
    this.currentPage.set(parseInt(queryParams['page'], 10) || 1);

    if (this.tasks().length === 0) {
      this.loadTasks();
    }
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
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  onFilterChange(): void {
    this.currentPage.set(1);
    this.updateQueryParams();
  }

  onSearchQueryChange(query: string): void {
    this.searchQuery.set(query);
    this.onFilterChange();
  }

  onClearSearch(): void {
    this.searchQuery.set('');
    this.onFilterChange();
  }

  onPageChange(page: number): void {
    if (page >= 1 && page <= this.filteredTotalPages) {
      this.currentPage.set(page);
      this.updateQueryParams();
    }
  }

  private updateQueryParams(): void {
    const params: Record<string, string> = {};
    if (this.searchQuery()) params.search = this.searchQuery();
    if (this.statusFilter()) params.status = this.statusFilter();
    if (this.priorityFilter()) params.priority = this.priorityFilter();
    if (this.projectFilter()) params.project = this.projectFilter();
    if (this.assigneeFilter()) params.assignee = this.assigneeFilter();
    if (this.currentPage() > 1) params.page = this.currentPage().toString();

    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: params,
      replaceUrl: true,
    });
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
    this.pendingDeleteTaskId.set(id);
    this.deleteTaskDialog.open();
  }

  confirmDeleteTask(): void {
    const id = this.pendingDeleteTaskId();
    this.taskStore.deleteTask(id).subscribe({
      next: () => {
        this.tasks.update((tasks) => tasks.filter((t) => t._id !== id));
      },
      error: (err) => console.error('Failed to delete task:', err),
    });
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
