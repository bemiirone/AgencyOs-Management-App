import { Component, computed, input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import {
  faExclamationTriangle,
  faExclamationCircle,
  faCalendarAlt,
  faCheckCircle,
} from '@fortawesome/free-solid-svg-icons';
import { Task } from '../../../shared/models/task.model';
import { Project } from '../../../shared/models/project.model';

@Component({
  selector: 'app-upcoming-tasks',
  standalone: true,
  imports: [CommonModule, RouterLink, FontAwesomeModule],
  templateUrl: './upcoming-tasks.component.html',
})
export class UpcomingTasksComponent {
  readonly tasks = input.required<Task[]>();
  readonly projects = input.required<Project[]>();

  readonly faExclamationTriangle = faExclamationTriangle;
  readonly faExclamationCircle = faExclamationCircle;
  readonly faCalendarAlt = faCalendarAlt;
  readonly faCheckCircle = faCheckCircle;

  readonly upcomingTasks = computed(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return this.tasks()
      .filter((task) => task.dueDate)
      .sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime())
      .slice(0, 5)
      .map((task) => {
        const dueDate = new Date(task.dueDate!);
        dueDate.setHours(0, 0, 0, 0);
        const diffTime = dueDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        let urgency: 'normal' | 'soon' | 'overdue' = 'normal';
        if (task.status !== 'done') {
          if (diffDays < 0) {
            urgency = 'overdue';
          } else if (diffDays >= 0 && diffDays <= 7) {
            urgency = 'soon';
          }
        }

        return {
          task,
          urgency,
          diffDays,
        };
      });
  });

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

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      todo: 'To Do',
      in_progress: 'In Progress',
      in_review: 'In Review',
      done: 'Done',
    };
    return labels[status] || status;
  }
}
