import { Component, inject, signal, computed, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
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
  imports: [CommonModule, ReactiveFormsModule, RouterLink, FontAwesomeModule],
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
  private readonly fb = inject(FormBuilder);

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

  taskForm: FormGroup = this.fb.group({
    title: ['', Validators.required],
    description: [''],
    projectId: ['', Validators.required],
    status: ['todo'],
    priority: ['medium'],
    dueDate: [''],
    assigneeId: [''],
  });

  get titleControl() { return this.taskForm.get('title'); }
  get projectIdControl() { return this.taskForm.get('projectId'); }

  ngOnInit(): void {
    this.projectStore.loadProjects().subscribe({
      next: (response) => this.projects.set(response.data),
      error: (err) => console.error('Failed to load projects:', err),
    });
  }

  onSubmit(): void {
    if (this.taskForm.invalid) {
      this.taskForm.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.error.set('');

    const formValue = this.taskForm.value;

    const taskData: CreateTaskPayload = {
      title: formValue.title,
      description: formValue.description,
      projectId: formValue.projectId,
      status: formValue.status,
      priority: formValue.priority,
      createdBy: this.authService.getUserId()!,
      assigneeIds: formValue.assigneeId ? [formValue.assigneeId] : [],
    };

    if (formValue.dueDate) {
      taskData.dueDate = new Date(formValue.dueDate);
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
