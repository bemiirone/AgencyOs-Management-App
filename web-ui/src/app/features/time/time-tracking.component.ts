import { Component, signal, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faPlay, faStop, faTrash, faSpinner, faClock, faSearch } from '@fortawesome/free-solid-svg-icons';
import { TimeEntryStore } from '../../stores/time-entry.store';
import { ProjectStore } from '../../stores/project.store';
import { TaskStore } from '../../stores/task.store';
import { AuthService } from '../../core/services/auth.service';
import { TimeEntry } from '../../shared/models/time-entry.model';
import { Project } from '../../shared/models/project.model';
import { Task } from '../../shared/models/task.model';

interface GroupedEntries {
  date: Date;
  label: string;
  entries: TimeEntry[];
  totalSeconds: number;
}

@Component({
  selector: 'app-time-tracking',
  standalone: true,
  imports: [CommonModule, FormsModule, FontAwesomeModule],
  templateUrl: './time-tracking.component.html',
})
export class TimeTrackingComponent implements OnInit, OnDestroy {
  timeEntryStore = inject(TimeEntryStore);
  private projectStore = inject(ProjectStore);
  private taskStore = inject(TaskStore);
  private authService = inject(AuthService);

  currentUserId = signal<string | null>(null);

  projects = signal<Project[]>([]);
  tasks = signal<Task[]>([]);
  groupedEntries = signal<GroupedEntries[]>([]);
  loading = signal(false);

  selectedProjectId = signal('');
  selectedTaskId = signal('');
  timerDescription = signal('');
  isBillable = signal(false);
  searchQuery = signal('');

  showRunningBanner = signal(false);
  runningTimerInfo = signal({ projectName: '', startedAgo: '' });

  elapsedSeconds = signal(0);
  private timerInterval: any = null;

  faPlay = faPlay;
  faStop = faStop;
  faTrash = faTrash;
  faSpinner = faSpinner;
  faClock = faClock;
  faSearch = faSearch;

  ngOnInit(): void {
    this.loading.set(true);
    this.currentUserId.set(this.authService.getUserId());

    this.projectStore.loadProjects().subscribe({
      next: (projects) => {
        this.projects.set(projects);
      },
      error: () => {},
    });

    this.timeEntryStore.cleanupAllOrphanedTimers().subscribe({
      next: () => this.loadEntries(),
      error: () => this.loadEntries(),
    });
  }

  private loadEntries(): void {
    const userId = this.currentUserId() || undefined;
    this.timeEntryStore.loadEntries(userId).subscribe({
      next: (entries) => {
        this.groupEntries(entries);
        this.loading.set(false);
        this.startElapsedTimer();
      },
      error: () => this.loading.set(false),
    });

    this.timeEntryStore.getRunningEntry().subscribe({
      next: (entry) => {
        if (entry) {
          this.selectedProjectId.set(entry.projectId);
          if (entry.taskId) this.selectedTaskId.set(entry.taskId);
          this.timerDescription.set(entry.description || '');
          this.isBillable.set(entry.isBillable);

          const projectName = this.getProjectName(entry.projectId);
          const startedAgo = this.timeAgo(new Date(entry.startTime));
          this.runningTimerInfo.set({ projectName, startedAgo });
          this.showRunningBanner.set(true);
        }
      },
      error: () => {},
    });
  }

  ngOnDestroy(): void {
    this.stopElapsedTimer();
  }

  onProjectChange(): void {
    const projectId = this.selectedProjectId();
    if (projectId) {
      this.taskStore.loadTasksByProject(projectId).subscribe({
        next: (tasks) => this.tasks.set(tasks),
        error: () => {},
      });
    } else {
      this.tasks.set([]);
      this.selectedTaskId.set('');
    }
  }

  startTimer(): void {
    const projectId = this.selectedProjectId();
    if (!projectId) return;

    const data: any = {
      projectId,
      description: this.timerDescription(),
      isBillable: this.isBillable(),
    };

    if (this.selectedTaskId()) {
      data.taskId = this.selectedTaskId();
    }

    this.timeEntryStore.startTimer(data).subscribe({
      next: (entry) => {
        this.elapsedSeconds.set(0);
        this.startElapsedTimer();
        const entries = this.timeEntryStore.entries();
        this.groupEntries(entries);
      },
      error: (err) => console.error('Failed to start timer:', err),
    });
  }

  stopTimer(): void {
    const running = this.timeEntryStore.runningEntry();
    if (!running) return;

    this.timeEntryStore.stopTimer(running._id).subscribe({
      next: () => {
        this.stopElapsedTimer();
        this.elapsedSeconds.set(0);
        this.showRunningBanner.set(false);
        const entries = this.timeEntryStore.entries();
        this.groupEntries(entries);
      },
      error: (err) => console.error('Failed to stop timer:', err),
    });
  }

  dismissBanner(): void {
    this.showRunningBanner.set(false);
  }

  deleteEntry(id: string): void {
    this.timeEntryStore.deleteEntry(id).subscribe({
      next: () => {
        const userId = this.currentUserId();
        const entries = this.timeEntryStore.entries();
        this.groupEntries(entries);
      },
      error: (err) => console.error('Failed to delete entry:', err),
    });
  }

  get filteredGroups(): GroupedEntries[] {
    const query = this.searchQuery().toLowerCase();
    if (!query) return this.groupedEntries();

    return this.groupedEntries()
      .map((group) => ({
        ...group,
        entries: group.entries.filter(
          (e) =>
            (e.description && e.description.toLowerCase().includes(query)) ||
            (e.projectName && e.projectName.toLowerCase().includes(query)) ||
            (e.taskTitle && e.taskTitle.toLowerCase().includes(query))
        ),
      }))
      .filter((group) => group.entries.length > 0);
  }

  getProjectName(projectId: string): string {
    const project = this.projects().find((p) => p._id === projectId);
    return project?.name || 'Unknown Project';
  }

  getTaskTitle(taskId: string | undefined): string {
    if (!taskId) return '';
    const task = this.tasks().find((t) => t._id === taskId);
    return task?.title || '';
  }

  private groupEntries(entries: TimeEntry[]): void {
    const userId = this.currentUserId();
    const userEntries = entries.filter((e) => e.userId === userId);
    const grouped: Map<string, GroupedEntries> = new Map();

    for (const entry of userEntries) {
      const date = new Date(entry.startTime);
      const dateKey = date.toDateString();
      const now = new Date();
      const today = now.toDateString();
      const yesterday = new Date(now.getTime() - 86400000).toDateString();

      let label: string;
      if (dateKey === today) label = 'Today';
      else if (dateKey === yesterday) label = 'Yesterday';
      else label = date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });

      if (!grouped.has(dateKey)) {
        grouped.set(dateKey, { date, label, entries: [], totalSeconds: 0 });
      }

      const group = grouped.get(dateKey)!;
      group.entries.push(entry);
      group.totalSeconds += entry.isRunning ? this.elapsedSeconds() : entry.duration;
    }

    this.groupedEntries.set(
      Array.from(grouped.values()).sort((a, b) => b.date.getTime() - a.date.getTime())
    );
  }

  private startElapsedTimer(): void {
    this.stopElapsedTimer();
    this.timerInterval = setInterval(() => {
      const running = this.timeEntryStore.runningEntry();
      if (running) {
        const elapsed = Math.floor((Date.now() - new Date(running.startTime).getTime()) / 1000);
        this.elapsedSeconds.set(elapsed);
      }
    }, 1000);
  }

  private stopElapsedTimer(): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  private timeAgo(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMinutes < 1) return 'just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  }
}
