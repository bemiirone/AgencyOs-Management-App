import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import {
  faProjectDiagram,
  faTasks,
  faClock,
  faFileInvoiceDollar,
  faUsers,
  faChartLine,
} from '@fortawesome/free-solid-svg-icons';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FontAwesomeModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent implements OnInit {
  private authService = inject(AuthService);

  faProjectDiagram = faProjectDiagram;
  faTasks = faTasks;
  faClock = faClock;
  faFileInvoiceDollar = faFileInvoiceDollar;
  faUsers = faUsers;
  faChartLine = faChartLine;

  userName = signal('');
  stats = signal({
    totalProjects: 0,
    activeTasks: 0,
    totalHours: 0,
    pendingInvoices: 0,
  });

  ngOnInit(): void {
    const user = this.authService.getUser();
    this.userName.set(user?.name ?? 'User');

    this.loadStats();
  }

  private loadStats(): void {
    this.stats.set({
      totalProjects: 12,
      activeTasks: 34,
      totalHours: 156.5,
      pendingInvoices: 8,
    });
  }
}
