import { Component, inject, signal, computed, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { forkJoin, combineLatest } from 'rxjs';
import { NgApexchartsModule } from 'ng-apexcharts';
import {
  faProjectDiagram,
  faTasks,
  faClock,
  faFileInvoiceDollar,
  faUsers,
  faChartLine,
  faPlus,
  faCheckCircle,
  faHourglassHalf,
  faFileAlt,
} from '@fortawesome/free-solid-svg-icons';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { StatCardComponent } from '../../shared/components/stat-card/stat-card.component';
import { RecentActivityComponent } from './recent-activity/recent-activity.component';
import { TeamMembersComponent } from './team-members/team-members.component';
import { UpcomingTasksComponent } from './upcoming-tasks/upcoming-tasks.component';
import { ChartCardComponent } from '../../shared/components/chart-card/chart-card.component';
import { Activity, TeamMember, DashboardStats, StatItem } from './dashboard.models';
import { ProjectStore } from '../../stores/project.store';
import { TaskStore } from '../../stores/task.store';
import { TimeEntryStore } from '../../stores/time-entry.store';
import { InvoiceStore } from '../../stores/invoice.store';
import { UserStore } from '../../stores/user.store';
import { ContentStore } from '../../stores/content.store';
import { Project } from '../../shared/models/project.model';
import { Task } from '../../shared/models/task.model';
import { TimeEntry } from '../../shared/models/time-entry.model';
import { Invoice } from '../../shared/models/invoice.model';
import { computeStats, buildActivities, mapTeamMembers, buildProjectStatusChart, buildTaskStatusChart } from './dashboard.transformers';
import type { ApexOptions } from 'apexcharts';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FontAwesomeModule, StatCardComponent, RecentActivityComponent, TeamMembersComponent, UpcomingTasksComponent, NgApexchartsModule, ChartCardComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly toast = inject(ToastService);
  private readonly projectStore = inject(ProjectStore);
  private readonly taskStore = inject(TaskStore);
  private readonly timeEntryStore = inject(TimeEntryStore);
  private readonly invoiceStore = inject(InvoiceStore);
  private readonly userStore = inject(UserStore);
  readonly contentStore = inject(ContentStore);

  readonly faProjectDiagram = faProjectDiagram;
  readonly faTasks = faTasks;
  readonly faClock = faClock;
  readonly faFileInvoiceDollar = faFileInvoiceDollar;
  readonly faUsers = faUsers;
  readonly faChartLine = faChartLine;
  readonly faPlus = faPlus;
  readonly faCheckCircle = faCheckCircle;
  readonly faHourglassHalf = faHourglassHalf;
  readonly faFileAlt = faFileAlt;

  private readonly avatarColors = ['bg-primary', 'bg-secondary', 'bg-accent', 'bg-info', 'bg-success', 'bg-warning'];

  readonly userName = signal('');
  readonly tenantName = signal('');
  readonly loading = signal(false);

  readonly projects = signal<Project[]>([]);
  readonly tasks = signal<Task[]>([]);
  readonly timeEntries = signal<TimeEntry[]>([]);
  readonly invoices = signal<Invoice[]>([]);
  readonly users = signal<{ id: string; name: string; role: string; isActive: boolean }[]>([]);

  readonly stats = computed<DashboardStats>(() =>
    computeStats(this.projects(), this.tasks(), this.timeEntries(), this.invoices())
  );

  readonly activities = computed<Activity[]>(() =>
    buildActivities(this.projects(), this.tasks(), this.invoices(), {
      project: faPlus,
      task: faTasks,
      invoice: faFileInvoiceDollar,
    })
  );

  readonly teamMembers = computed<TeamMember[]>(() =>
    mapTeamMembers(this.users(), this.avatarColors)
  );

  readonly projectChartData = computed<ApexOptions>(() =>
    buildProjectStatusChart(this.projects())
  );

  readonly taskChartData = computed<ApexOptions>(() =>
    buildTaskStatusChart(this.tasks())
  );

  readonly statItems: StatItem[] = [
    { icon: faProjectDiagram, key: 'totalProjects', title: this.contentStore.content('dashboard.stats.projects.title'), description: this.contentStore.content('dashboard.stats.projects.description'), color: 'text-primary' },
    { icon: faTasks, key: 'activeTasks', title: this.contentStore.content('dashboard.stats.tasks.title'), description: this.contentStore.content('dashboard.stats.tasks.description'), color: 'text-secondary' },
    { icon: faClock, key: 'totalHours', title: this.contentStore.content('dashboard.stats.hours.title'), description: this.contentStore.content('dashboard.stats.hours.description'), color: 'text-accent' },
    { icon: faFileInvoiceDollar, key: 'pendingInvoices', title: this.contentStore.content('dashboard.stats.invoices.title'), description: this.contentStore.content('dashboard.stats.invoices.description'), color: 'text-info' },
  ];

  ngOnInit(): void {
    const user = this.authService.getUser();
    this.userName.set(user?.name ?? 'User');
    this.tenantName.set(user?.tenantName ?? '');
    this.loadDashboard();
  }

  private loadDashboard(): void {
    this.loading.set(true);

    const dashboardData$ = forkJoin({
      projects: this.projectStore.loadAllProjects(),
      tasks: this.taskStore.loadAllTasks(),
      timeEntries: this.timeEntryStore.loadEntries(),
      invoices: this.invoiceStore.loadInvoices(),
    });

    const users$ = this.userStore.loadUsers();

    combineLatest([dashboardData$, users$]).subscribe({
      next: ([{ projects, tasks, timeEntries, invoices }, users]) => {
        this.projects.set(projects.data);
        this.tasks.set(tasks.data);
        this.timeEntries.set(timeEntries);
        this.invoices.set(invoices);
        this.users.set(users);
        this.loading.set(false);
      },
      error: () => {
        this.toast.error(this.contentStore.content('dashboard.error.loadFailed'));
        this.loading.set(false);
      },
    });
  }
}

