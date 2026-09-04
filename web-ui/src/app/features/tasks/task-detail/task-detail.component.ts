import { Component, inject, signal, OnInit, ChangeDetectionStrategy, ViewChild } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
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
  faTrash,
  faClock,
  faListUl,
} from '@fortawesome/free-solid-svg-icons';
import { Task } from '../../../shared/models/task.model';
import { Project } from '../../../shared/models/project.model';
import { TaskStore } from '../../../stores/task.store';
import { ProjectStore } from '../../../stores/project.store';
import { UserStore } from '../../../stores/user.store';
import { TimeEntryStore } from '../../../stores/time-entry.store';
import { TimeEntry } from '../../../shared/models/time-entry.model';
import { StatCardComponent } from '../../../shared/components/stat-card/stat-card.component';
import { TimeEntriesListComponent } from '../../../shared/components/time-entries-list/time-entries-list.component';
import { ContentCardComponent } from '../../../shared/components/content-card/content-card.component';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { IconDefinition } from '@fortawesome/free-solid-svg-icons';

interface StatConfig {
  icon: IconDefinition;
  title: string;
  colorClass: string;
  formKey?: 'status' | 'priority' | 'dueDate';
  options?: { value: string; label: string }[];
  isDate?: boolean;
  readonly?: boolean;
}

@Component({
  selector: 'app-task-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, FontAwesomeModule, StatCardComponent, TimeEntriesListComponent, ContentCardComponent, ConfirmDialogComponent],
  templateUrl: './task-detail.component.html',
  styleUrl: './task-detail.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaskDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly taskStore = inject(TaskStore);
  private readonly projectStore = inject(ProjectStore);
  private readonly userStore = inject(UserStore);
  readonly timeEntryStore = inject(TimeEntryStore);

  readonly task = signal<Task | null>(null);
  readonly subtasks = signal<Task[]>([]);
  readonly timeEntries = signal<TimeEntry[]>([]);
  readonly projects = signal<Project[]>([]);
  readonly loading = signal(false);
  readonly editing = signal(false);

  readonly faArrowLeft = faArrowLeft;
  readonly faCalendar = faCalendar;
  readonly faFlag = faFlag;
  readonly faSpinner = faSpinner;
  readonly faEdit = faEdit;
  readonly faSave = faSave;
  readonly faTimes = faTimes;
  readonly faTrash = faTrash;
  readonly faClock = faClock;
  readonly faListUl = faListUl;

  @ViewChild('confirmDialog') confirmDialog!: ConfirmDialogComponent;

  readonly stats: StatConfig[] = [
    {
      icon: faFlag,
      title: 'Status',
      colorClass: 'text-primary',
      formKey: 'status',
      options: [
        { value: 'todo', label: 'To Do' },
        { value: 'in_progress', label: 'In Progress' },
        { value: 'in_review', label: 'In Review' },
        { value: 'done', label: 'Done' },
      ],
    },
    {
      icon: faFlag,
      title: 'Priority',
      colorClass: 'text-secondary',
      formKey: 'priority',
      options: [
        { value: 'low', label: 'Low' },
        { value: 'medium', label: 'Medium' },
        { value: 'high', label: 'High' },
        { value: 'urgent', label: 'Urgent' },
      ],
    },
    {
      icon: faCalendar,
      title: 'Due Date',
      colorClass: 'text-accent',
      formKey: 'dueDate',
      isDate: true,
    },
    {
      icon: faClock,
      title: 'Time Logged',
      colorClass: 'text-info',
      readonly: true,
    },
  ];

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
      next: (response) => this.projects.set(response.data),
      error: (err) => console.error('Failed to load projects:', err),
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
        this.loadTaskData(id);
      },
      error: () => this.loading.set(false),
    });
  }

  private loadTaskData(taskId: string): void {
    const t = this.task();
    if (!t) return;

    this.taskStore.loadTasksByProject(t.projectId).subscribe({
      next: (tasks) => {
        const subs = tasks.filter((task) => task.parentTaskId === taskId);
        this.subtasks.set(subs);
        this.checkLoadingComplete();
      },
      error: () => this.checkLoadingComplete(),
    });

    this.timeEntryStore.loadEntriesByTask(taskId).subscribe({
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
      error: (err) => console.error('Failed to update task:', err),
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

  openDeleteConfirm(): void {
    this.confirmDialog.open();
  }

  deleteTask(): void {
    const id = this.task()?._id;
    if (!id) return;

    this.taskStore.deleteTask(id).subscribe({
      next: () => {
        this.router.navigate(['/tasks'], { queryParamsHandling: 'preserve' });
      },
      error: (err) => console.error('Failed to delete task:', err),
    });
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

  getUserName(userId: string, fallback = 'Unknown'): string {
    if (!userId) return fallback;
    const user = this.userStore.users().find((u) => u.id === userId);
    return user?.name || fallback;
  }

  getAssigneeName(): string {
    const t = this.task();
    if (!t) return 'Unassigned';
    const assigneeId = t.assigneeIds?.[0];
    if (!assigneeId) return 'Unassigned';
    return this.getUserName(assigneeId, 'Unassigned');
  }

  getAssigneeId(): string {
    const t = this.task();
    return t?.assigneeIds?.[0] || '';
  }

  getCreatorName(): string {
    const t = this.task();
    if (!t?.createdBy) return 'Unknown';
    return this.getUserName(t.createdBy);
  }

  getCreatorId(): string {
    const t = this.task();
    return t?.createdBy || '';
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
