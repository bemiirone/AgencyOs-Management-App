import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { HttpClient } from '@angular/common/http';
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
import { ProjectStore } from '../../stores/project.store';
import { API_CONFIG } from '../../core/config/api.config';

interface Activity {
  icon: any;
  color: string;
  message: string;
  time: string;
}

interface TeamMember {
  initials: string;
  name: string;
  role: string;
  color: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FontAwesomeModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent implements OnInit {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private projectStore = inject(ProjectStore);

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
  stats = signal({
    totalProjects: 0,
    activeTasks: 0,
    totalHours: 0,
    pendingInvoices: 0,
  });
  activities = signal<Activity[]>([]);
  teamMembers = signal<TeamMember[]>([]);
  loading = signal(false);

  ngOnInit(): void {
    const user = this.authService.getUser();
    this.userName.set(user?.name ?? 'User');

    this.loadDashboard();
  }

  private loadDashboard(): void {
    this.loading.set(true);

    const projects$ = this.http.get<any[]>(API_CONFIG.PROJECTS.LIST);
    const tasks$ = this.http.get<any[]>(API_CONFIG.TASKS.LIST);
    const timeEntries$ = this.http.get<any[]>(API_CONFIG.TIME_ENTRIES.LIST);
    const invoices$ = this.http.get<any[]>(API_CONFIG.INVOICES.LIST);

    projects$.subscribe({
      next: (projects) => {
        const totalProjects = projects.length;
        this.stats.update((s) => ({ ...s, totalProjects }));

        const recentProjects = projects.slice(-3).reverse();
        const acts: Activity[] = recentProjects.map((p) => ({
          icon: faPlus,
          color: 'bg-primary',
          message: `Project "${p.name}" created`,
          time: this.timeAgo(p.createdAt),
        }));

        this.activities.set(acts);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });

    tasks$.subscribe({
      next: (tasks) => {
        const activeTasks = tasks.filter(
          (t) => t.status === 'in_progress' || t.status === 'todo'
        ).length;
        this.stats.update((s) => ({ ...s, activeTasks }));
      },
      error: () => {},
    });

    timeEntries$.subscribe({
      next: (entries) => {
        const totalMinutes = entries.reduce(
          (sum, e) => sum + (e.duration || 0),
          0
        );
        this.stats.update((s) => ({ ...s, totalHours: Math.round((totalMinutes / 60) * 10) / 10 }));
      },
      error: () => {},
    });

    invoices$.subscribe({
      next: (invoices) => {
        const pendingInvoices = invoices.filter(
          (i) => i.status === 'draft' || i.status === 'sent'
        ).length;
        this.stats.update((s) => ({ ...s, pendingInvoices }));
      },
      error: () => {},
    });

    const user = this.authService.getUser();
    if (user) {
      this.teamMembers.set([
        { initials: this.getInitials(user.name), name: user.name, role: user.role, color: 'bg-primary' },
      ]);
    }
  }

  private timeAgo(date: string): string {
    const now = new Date();
    const then = new Date(date);
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
