import { Component, inject, signal, computed, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import {
  faArrowLeft,
  faSpinner,
  faSave,
  faInfoCircle,
} from '@fortawesome/free-solid-svg-icons';
import { TaskStore } from '../../../stores/task.store';
import { ProjectStore } from '../../../stores/project.store';
import { UserStore } from '../../../stores/user.store';
import { AuthService } from '../../../core/services/auth.service';
import { Project } from '../../../shared/models/project.model';
import { CreateTaskPayload, TaskStatus, TaskPriority } from '../task.models';

@Component({
  selector: 'app-task-create',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, FontAwesomeModule],
  templateUrl: './task-create.component.html',
  styleUrl: './task-create.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaskCreateComponent implements OnInit {
  private readonly taskStore = inject(TaskStore);
  private readonly projectStore = inject(ProjectStore);
  readonly userStore = inject(UserStore);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly projects = signal<Project[]>([]);
  readonly loading = signal(false);
  readonly error = signal('');

  readonly faArrowLeft = faArrowLeft;
  readonly faSpinner = faSpinner;
  readonly faSave = faSave;
  readonly faInfoCircle = faInfoCircle;

  readonly availableProjects = computed(() =>
    this.projects().filter((p) => p.status === 'active' || p.status === 'draft')
  );

  form = {
    title: '',
    description: '',
    projectId: '',
    status: 'todo' as TaskStatus,
    priority: 'medium' as TaskPriority,
    dueDate: '',
    assigneeId: '',
  };

  ngOnInit(): void {
    this.projectStore.loadProjects().subscribe({
      next: (response) => this.projects.set(response.data),
      error: (err) => console.error('Failed to load projects:', err),
    });
  }

  onSubmit(): void {
    if (!this.form.title || !this.form.projectId) {
      this.error.set('Title and Project are required');
      return;
    }

    this.loading.set(true);
    this.error.set('');

    const taskData: CreateTaskPayload = {
      title: this.form.title,
      description: this.form.description,
      projectId: this.form.projectId,
      status: this.form.status,
      priority: this.form.priority,
      createdBy: this.authService.getUserId()!,
      assigneeIds: this.form.assigneeId ? [this.form.assigneeId] : [],
    };

    if (this.form.dueDate) {
      taskData.dueDate = new Date(this.form.dueDate);
    }

    this.taskStore.createTask(taskData).subscribe({
      next: (task) => {
        this.loading.set(false);
        this.router.navigate(['/tasks', task._id], { queryParamsHandling: 'preserve' });
      },
      error: (err) => {
        this.error.set(err.error?.message || 'Failed to create task');
        this.loading.set(false);
      },
    });
  }
}
