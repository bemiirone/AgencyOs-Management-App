import { Component, inject, signal, computed, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { HttpClient } from '@angular/common/http';
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
import { API_CONFIG } from '../../core/config/api.config';
import { StatCardComponent } from '../../shared/components/stat-card/stat-card.component';
import { PaginatedResponse } from '../../shared/models/paginated-response.model';
import { RecentActivityComponent } from './recent-activity/recent-activity.component';
import { TeamMembersComponent } from './team-members/team-members.component';
import { UpcomingTasksComponent } from './upcoming-tasks/upcoming-tasks.component';
import { ChartCardComponent } from '../../shared/components/chart-card/chart-card.component';
import { Activity, TeamMember, DashboardStats, StatItem } from './dashboard.models';
import { ToastService } from '../../core/services/toast.service';
import { UserStore } from '../../stores/user.store';
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
  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);
  private readonly toast = inject(ToastService);
  private readonly userStore = inject(UserStore);

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
    buildActivities(this.projects(), this.tasks(), {
      project: faPlus,
      task: faTasks,
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
    { icon: faProjectDiagram, key: 'totalProjects', title: 'Total Projects', description: 'Active and completed', color: 'text-primary' },
    { icon: faTasks, key: 'activeTasks', title: 'Active Tasks', description: 'In progress', color: 'text-secondary' },
    { icon: faClock, key: 'totalHours', title: 'Total Hours', description: 'Tracked this month', color: 'text-accent' },
    { icon: faFileInvoiceDollar, key: 'pendingInvoices', title: 'Pending Invoices', description: 'Awaiting payment', color: 'text-info' },
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
      projects: this.http.get<PaginatedResponse<Project>>(API_CONFIG.PROJECTS.LIST(1, 100)),
      tasks: this.http.get<PaginatedResponse<Task>>(API_CONFIG.TASKS.LIST(1, 100)),
      timeEntries: this.http.get<TimeEntry[]>(API_CONFIG.TIME_ENTRIES.LIST),
      invoices: this.http.get<Invoice[]>(API_CONFIG.INVOICES.LIST),
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
        this.toast.error('Failed to load dashboard data');
        this.loading.set(false);
      },
    });
  }
}

