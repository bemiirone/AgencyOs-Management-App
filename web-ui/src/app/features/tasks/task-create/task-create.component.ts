import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import {
  faArrowLeft,
  faSpinner,
  faSave,
} from '@fortawesome/free-solid-svg-icons';
import { TaskStore } from '../../../stores/task.store';
import { ProjectStore } from '../../../stores/project.store';

@Component({
  selector: 'app-task-create',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, FontAwesomeModule],
  templateUrl: './task-create.component.html',
  styleUrl: './task-create.component.scss',
})
export class TaskCreateComponent implements OnInit {
  private taskStore = inject(TaskStore);
  private projectStore = inject(ProjectStore);
  private router = inject(Router);

  projects = signal<any[]>([]);
  loading = signal(false);
  error = signal('');

  faArrowLeft = faArrowLeft;
  faSpinner = faSpinner;
  faSave = faSave;

  form = {
    title: '',
    description: '',
    projectId: '',
    status: 'todo' as const,
    priority: 'medium' as const,
    dueDate: '',
  };

  ngOnInit(): void {
    this.projectStore.loadProjects().subscribe({
      next: (projects) => this.projects.set(projects),
      error: () => {},
    });
  }

  onSubmit(): void {
    if (!this.form.title || !this.form.projectId) {
      this.error.set('Title and Project are required');
      return;
    }

    this.loading.set(true);
    this.error.set('');

    const taskData: any = {
      title: this.form.title,
      description: this.form.description,
      projectId: this.form.projectId,
      status: this.form.status,
      priority: this.form.priority,
    };

    if (this.form.dueDate) {
      taskData.dueDate = new Date(this.form.dueDate);
    }

    this.taskStore.createTask(taskData).subscribe({
      next: (task) => {
        this.loading.set(false);
        this.router.navigate(['/tasks', task._id]);
      },
      error: (err) => {
        this.error.set(err.error?.message || 'Failed to create task');
        this.loading.set(false);
      },
    });
  }
}
