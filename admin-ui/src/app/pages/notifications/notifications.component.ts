import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { AdminApiService } from '../../services/admin-api.service';
import { NotificationSettings, NotificationTypeConfig } from '../../models/notification-settings.model';

interface NotificationTypeSection {
  key: 'projectDueSoon' | 'projectOverdue' | 'taskDueSoon' | 'taskOverdue';
  label: string;
  description: string;
}

@Component({
  selector: 'admin-notifications',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatSlideToggleModule,
    MatInputModule,
    MatFormFieldModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatDividerModule,
  ],
  templateUrl: './notifications.component.html',
  styleUrl: './notifications.component.scss',
})
export class NotificationsComponent implements OnInit {
  private adminApi = inject(AdminApiService);
  private snackBar = inject(MatSnackBar);
  private cdr = inject(ChangeDetectorRef);

  settings: NotificationSettings | null = null;
  isLoading = true;
  isSaving = false;

  sections: NotificationTypeSection[] = [
    { key: 'projectDueSoon', label: 'Project Due Soon', description: 'Triggered when a project deadline is within 7 days' },
    { key: 'projectOverdue', label: 'Project Overdue', description: 'Triggered when a project has passed its deadline' },
    { key: 'taskDueSoon', label: 'Task Due Soon', description: 'Triggered when a task deadline is within 7 days' },
    { key: 'taskOverdue', label: 'Task Overdue', description: 'Triggered when a task has passed its deadline' },
  ];

  private readonly defaults: Record<string, NotificationTypeConfig> = {
    projectDueSoon: {
      enabled: true,
      titleTemplate: "Project '{{name}}' due in less than a week",
      messageTemplate: "The project '{{name}}' has a deadline approaching. Please review progress.",
    },
    projectOverdue: {
      enabled: true,
      titleTemplate: "Project '{{name}}' is overdue",
      messageTemplate: "The project '{{name}}' has exceeded its deadline. Immediate attention required.",
    },
    taskDueSoon: {
      enabled: true,
      titleTemplate: "Task '{{title}}' due in less than a week",
      messageTemplate: "The task '{{title}}' has a deadline approaching.",
    },
    taskOverdue: {
      enabled: true,
      titleTemplate: "Task '{{title}}' is overdue",
      messageTemplate: "The task '{{title}}' has exceeded its deadline.",
    },
  };

  ngOnInit(): void {
    this.loadSettings();
  }

  loadSettings(): void {
    this.isLoading = true;
    this.adminApi.getNotificationSettings().subscribe({
      next: (data) => {
        this.settings = this.ensureDefaults(data);
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.isLoading = false;
        this.snackBar.open('Failed to load notification settings', 'Close', { duration: 3000 });
      },
    });
  }

  private ensureDefaults(settings: NotificationSettings): NotificationSettings {
    const keys = ['projectDueSoon', 'projectOverdue', 'taskDueSoon', 'taskOverdue'] as const;
    for (const key of keys) {
      if (!settings[key]) {
        (settings as any)[key] = { ...this.defaults[key] };
      }
    }
    return settings;
  }

  saveSettings(): void {
    if (!this.settings) return;
    this.isSaving = true;
    this.adminApi.updateNotificationSettings(this.settings).subscribe({
      next: () => {
        this.isSaving = false;
        this.snackBar.open('Notification settings saved', 'Close', { duration: 3000 });
      },
      error: () => {
        this.isSaving = false;
        this.snackBar.open('Failed to save notification settings', 'Close', { duration: 3000 });
      },
    });
  }

  resetToDefaults(section: NotificationTypeSection): void {
    if (!this.settings) return;
    this.settings[section.key] = { ...this.defaults[section.key] };
  }

  formatLastRun(date?: string): string {
    if (!date) return 'Never';
    return new Date(date).toLocaleString();
  }
}
