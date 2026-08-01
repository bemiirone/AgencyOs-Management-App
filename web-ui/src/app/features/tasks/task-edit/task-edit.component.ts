import { Component, inject, signal, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import {
  faArrowLeft,
  faSpinner,
  faSave,
} from '@fortawesome/free-solid-svg-icons';
import { Task } from '../../../shared/models/task.model';
import { Project } from '../../../shared/models/project.model';
import { TaskStore } from '../../../stores/task.store';
import { ProjectStore } from '../../../stores/project.store';
import { UserStore } from '../../../stores/user.store';
import { AuthService } from '../../../core/services/auth.service';
import { UpdateTaskPayload, TaskStatus, TaskPriority } from '../task.models';

@Component({
  selector: 'app-task-edit',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, FontAwesomeModule],
  templateUrl: './task-edit.component.html',
  styleUrl: './task-edit.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaskEditComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private taskStore = inject(TaskStore);
  private projectStore = inject(ProjectStore);
  private userStore = inject(UserStore);
  private authService = inject(AuthService);
  private router = inject(Router);

  projects = signal<Project[]>([]);
  loading = signal(true);
  saving = signal(false);
  error = signal('');
  taskId = signal('');
  dataLoaded = signal(false);

  faArrowLeft = faArrowLeft;
  faSpinner = faSpinner;
  faSave = faSave;

  form = {
    title: '',
    description: '',
    projectId: '',
    status: 'todo' as TaskStatus,
    priority: 'medium' as TaskPriority,
    dueDate: '',
    assigneeId: '',
    createdBy: '',
  };

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.loading.set(false);
      return;
    }

    this.taskId.set(id);

    this.projectStore.loadProjects().subscribe({
      next: (projects) => this.projects.set(projects),
      error: (err) => console.error('Failed to load projects:', err),
    });

    this.taskStore.loadTask(id).subscribe({
      next: (task) => {
        this.form.title = task.title;
        this.form.description = task.description || '';
        this.form.projectId = task.projectId;
        this.form.status = task.status;
        this.form.priority = task.priority;
        this.form.dueDate = task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '';
        this.form.assigneeId = task.assigneeIds?.[0] || '';
        this.form.createdBy = task.createdBy || '';
        this.dataLoaded.set(true);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Failed to load task');
        this.loading.set(false);
      },
    });
  }

  onSubmit(): void {
    const id = this.taskId();
    if (!id || !this.form.title || !this.form.projectId) {
      this.error.set('Title and Project are required');
      return;
    }

    this.saving.set(true);
    this.error.set('');

    const taskData: UpdateTaskPayload = {
      title: this.form.title,
      description: this.form.description,
      projectId: this.form.projectId,
      status: this.form.status,
      priority: this.form.priority,
      assigneeId: this.form.assigneeId || undefined,
    };

    if (this.form.dueDate) {
      taskData.dueDate = new Date(this.form.dueDate);
    }

    this.taskStore.updateTask(id, taskData).subscribe({
      next: (task) => {
        this.saving.set(false);
        this.router.navigate(['/tasks', task._id]);
      },
      error: (err) => {
        this.error.set(err.error?.message || 'Failed to update task');
        this.saving.set(false);
      },
    });
  }

  getCreatorName(): string {
    if (!this.form.createdBy) return 'Unknown';
    const user = this.userStore.users().find((u) => u.id === this.form.createdBy);
    return user?.name || 'Unknown';
  }
}
