import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { HttpClient } from '@angular/common/http';
import { forkJoin } from 'rxjs';
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
import { Activity, TeamMember, DashboardStats, StatItem } from './dashboard.models';
import { ToastService } from '../../core/services/toast.service';
import { Project } from '../../shared/models/project.model';
import { Task } from '../../shared/models/task.model';
import { TimeEntry } from '../../shared/models/time-entry.model';
import { Invoice } from '../../shared/models/invoice.model';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FontAwesomeModule, StatCardComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent implements OnInit {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private toast = inject(ToastService);

  faProjectDiagram = faProjectDiagram;
  faTasks = faTasks;
  faClock = faClock;
  faFileInvoiceDollar = faFileInvoiceDollar;
  faUsers = faUsers;
  faChartLine = faChartLine;
  faPlus = faPlus;
  faCheckCircle = faCheckCircle;
  faHourglassHalf = faHourglassHalf;
  faFileAlt = faFileAlt;

  userName = signal('');
  tenantName = signal('');
  stats = signal<DashboardStats>({
    totalProjects: 0,
    activeTasks: 0,
    totalHours: 0,
    pendingInvoices: 0,
  });
  activities = signal<Activity[]>([]);
  teamMembers = signal<TeamMember[]>([]);
  loading = signal(false);

  statItems: StatItem[] = [
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

    forkJoin({
      projects: this.http.get<Project[]>(API_CONFIG.PROJECTS.LIST),
      tasks: this.http.get<Task[]>(API_CONFIG.TASKS.LIST),
      timeEntries: this.http.get<TimeEntry[]>(API_CONFIG.TIME_ENTRIES.LIST),
      invoices: this.http.get<Invoice[]>(API_CONFIG.INVOICES.LIST),
    }).subscribe({
      next: ({ projects, tasks, timeEntries, invoices }) => {
        const totalProjects = projects.length;
        const activeTasks = tasks.filter(
          (t) => t.status === 'in_progress' || t.status === 'todo'
        ).length;
        const totalMinutes = timeEntries.reduce(
          (sum, e) => sum + (e.duration || 0),
          0
        );
        const totalHours = Math.round((totalMinutes / 60) * 10) / 10;
        const pendingInvoices = invoices.filter(
          (i) => i.status === 'draft' || i.status === 'sent'
        ).length;

        this.stats.set({ totalProjects, activeTasks, totalHours, pendingInvoices });

        const recentProjects = projects.slice(0, 3);
        const recentTasks = tasks.slice(0, 3);

        const projectActs: Activity[] = recentProjects.map((p) => ({
          icon: faPlus,
          color: 'bg-primary',
          message: `Project "${p.name}" created`,
          time: this.timeAgo(p.createdAt),
        }));

        const taskActs: Activity[] = recentTasks.map((t) => ({
          icon: faTasks,
          color: 'bg-secondary',
          message: `Task "${t.title}" created`,
          time: this.timeAgo(t.createdAt),
        }));

        const allActs = [...projectActs, ...taskActs]
          .sort((a, b) => {
            const parseTime = (timeStr: string) => {
              if (timeStr === 'Just now') return 0;
              const num = parseInt(timeStr);
              if (timeStr.includes('h')) return num * 60;
              if (timeStr.includes('d')) return num * 24 * 60;
              return 999999;
            };
            return parseTime(a.time) - parseTime(b.time);
          })
          .reverse()
          .slice(0, 6);

        this.activities.set(allActs);
        this.loading.set(false);
      },
      error: () => {
        this.toast.error('Failed to load dashboard data');
        this.loading.set(false);
      },
    });

    const user = this.authService.getUser();
    if (user) {
      this.teamMembers.set([
        { initials: this.getInitials(user.name), name: user.name, role: user.role, color: 'bg-primary' },
      ]);
    }
  }

  private timeAgo(date: string | Date): string {
    const then = date instanceof Date ? date : new Date(date);
    const now = new Date();
    const diffMs = now.getTime() - then.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return '1d ago';
    return `${diffDays}d ago`;
  }

  private getInitials(name: string): string {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }
}
