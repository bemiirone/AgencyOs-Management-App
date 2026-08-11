import { Component, input, output, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faTasks, faHourglassHalf, faTrash, faPlay } from '@fortawesome/free-solid-svg-icons';
import { Task } from '../../../shared/models/task.model';
import { TimeEntry } from '../../../shared/models/time-entry.model';
import { TimeEntryStore } from '../../../stores/time-entry.store';

@Component({
  selector: 'app-task-list-card',
  standalone: true,
  imports: [CommonModule, RouterLink, FontAwesomeModule],
  templateUrl: './task-list-card.component.html',
  styleUrl: './task-list-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaskListCardComponent {
  private readonly timeEntryStore = inject(TimeEntryStore);

  readonly tasks = input.required<Task[]>();
  readonly timeEntries = input<TimeEntry[]>([]);
  readonly showAddButton = input<boolean>(true);
  readonly addTaskRoute = input<string>('/tasks/create');

  readonly deleteTask = output<string>();
  readonly addTask = output<void>();

  readonly faTasks = faTasks;
  readonly faHourglassHalf = faHourglassHalf;
  readonly faTrash = faTrash;
  readonly faPlay = faPlay;

  formatDate(date: string | Date | undefined): string {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString();
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

  getTaskTimeEntries(taskId: string): TimeEntry[] {
    return this.timeEntries().filter((e) => e.taskId === taskId).slice(0, 3);
  }

  formatDuration(duration: number): string {
    return this.timeEntryStore.formatDurationShort(duration);
  }

  onDeleteTask(taskId: string): void {
    this.deleteTask.emit(taskId);
  }

  onAddTask(): void {
    this.addTask.emit();
  }
}
