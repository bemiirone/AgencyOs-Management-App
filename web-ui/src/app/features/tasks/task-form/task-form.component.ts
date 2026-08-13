import { Component, inject, signal, computed, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
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
import { Task } from '../../../shared/models/task.model';
import { CreateTaskPayload, UpdateTaskPayload } from '../task.models';

@Component({
  selector: 'app-task-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, FontAwesomeModule],
  templateUrl: './task-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaskFormComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly taskStore = inject(TaskStore);
  private readonly projectStore = inject(ProjectStore);
  readonly userStore = inject(UserStore);
  private readonly authService = inject(AuthService);
  private readonly fb = inject(FormBuilder);

  readonly mode = signal<'create' | 'edit'>('create');
  readonly projects = signal<Project[]>([]);
  readonly loadedTask = signal<Task | null>(null);
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly error = signal('');
  readonly taskId = signal('');

  readonly faArrowLeft = faArrowLeft;
  readonly faSpinner = faSpinner;
  readonly faSave = faSave;
  readonly faInfoCircle = faInfoCircle;

  readonly availableProjects = computed(() =>
    this.projects().filter((p) => p.status === 'active' || p.status === 'draft')
  );

  taskForm: FormGroup = this.fb.group({
    title: ['', Validators.required],
    description: [''],
    projectId: ['', Validators.required],
    status: ['todo'],
    priority: ['medium'],
    dueDate: [''],
    assigneeId: ['unassigned'],
  });

  get titleControl() { return this.taskForm.get('title'); }
  get projectIdControl() { return this.taskForm.get('projectId'); }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');

    this.projectStore.loadProjects().subscribe({
      next: (response) => this.projects.set(response.data),
      error: (err) => console.error('Failed to load projects:', err),
    });

    if (id) {
      this.mode.set('edit');
      this.taskId.set(id);
      this.loading.set(true);

      this.taskStore.loadTask(id).subscribe({
        next: (task: Task) => {
          this.loadedTask.set(task);
          this.taskForm.patchValue({
            title: task.title,
            description: task.description || '',
            projectId: task.projectId,
            status: task.status,
            priority: task.priority,
            dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '',
            assigneeId: task.assigneeIds?.[0] || 'unassigned',
          });
          this.loading.set(false);
        },
        error: () => {
          this.error.set('Failed to load task');
          this.loading.set(false);
        },
      });
    } else {
      this.mode.set('create');
    }
  }

  onSubmit(): void {
    if (this.taskForm.invalid) {
      this.taskForm.markAllAsTouched();
      return;
    }

    if (this.mode() === 'create') {
      this.saving.set(true);
    } else {
      this.saving.set(true);
    }
    this.error.set('');

    const formValue = this.taskForm.value;

    if (this.mode() === 'create') {
      const taskData: CreateTaskPayload = {
        title: formValue.title,
        description: formValue.description,
        projectId: formValue.projectId,
        status: formValue.status,
        priority: formValue.priority,
        createdBy: this.authService.getUserId()!,
        assigneeIds: formValue.assigneeId?.trim() && formValue.assigneeId !== 'unassigned' ? [formValue.assigneeId] : undefined,
      };

      if (formValue.dueDate) {
        taskData.dueDate = new Date(formValue.dueDate);
      }

      this.taskStore.createTask(taskData).subscribe({
        next: (task) => {
          this.saving.set(false);
          this.router.navigate(['/tasks', task._id], { queryParamsHandling: 'preserve' });
        },
        error: (err) => {
          this.error.set(err.error?.message || 'Failed to create task');
          this.saving.set(false);
        },
      });
    } else {
      const id = this.taskId();
      const taskData: UpdateTaskPayload = {
        title: formValue.title,
        description: formValue.description,
        projectId: formValue.projectId,
        status: formValue.status,
        priority: formValue.priority,
        assigneeIds: formValue.assigneeId?.trim() && formValue.assigneeId !== 'unassigned' ? [formValue.assigneeId] : undefined,
      };

      if (formValue.dueDate) {
        taskData.dueDate = new Date(formValue.dueDate);
      }

      this.taskStore.updateTask(id, taskData).subscribe({
        next: (task) => {
          this.saving.set(false);
          this.router.navigate(['/tasks', task._id], { queryParamsHandling: 'preserve' });
        },
        error: (err) => {
          this.error.set(err.error?.message || 'Failed to update task');
          this.saving.set(false);
        },
      });
    }
  }

  getCreatorName(): string {
    const task = this.loadedTask();
    if (!task?.createdBy) return 'Unknown';
    const user = this.userStore.users().find((u) => u.id === task.createdBy);
    return user?.name || 'Unknown';
  }
}
