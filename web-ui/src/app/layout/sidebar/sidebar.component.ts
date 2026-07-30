import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import {
  faHome,
  faProjectDiagram,
  faTasks,
  faClock,
  faFileInvoiceDollar,
  faUsers,
  faCog,
  faBars,
  faBuilding,
} from '@fortawesome/free-solid-svg-icons';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, FontAwesomeModule],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss',
})
export class SidebarComponent implements OnInit {
  private authService = inject(AuthService);

  faHome = faHome;
  faProjectDiagram = faProjectDiagram;
  faTasks = faTasks;
  faClock = faClock;
  faFileInvoiceDollar = faFileInvoiceDollar;
  faUsers = faUsers;
  faCog = faCog;
  faBars = faBars;
  faBuilding = faBuilding;

  tenantName = signal('');
  userRole = signal('');

  ngOnInit(): void {
    this.tenantName.set(this.authService.getTenantName());
    this.userRole.set(this.authService.getUserRole());
  }

  navItems = [
    { label: 'Dashboard', icon: faHome, route: '/dashboard' },
    { label: 'Projects', icon: faProjectDiagram, route: '/projects' },
    { label: 'Tasks', icon: faTasks, route: '/tasks' },
    { label: 'Time Tracking', icon: faClock, route: '/time' },
    { label: 'Invoices', icon: faFileInvoiceDollar, route: '/invoices' },
    { label: 'Team', icon: faUsers, route: '/admin/users' },
    { label: 'Settings', icon: faCog, route: '/settings' },
  ];

  adminNavItems = [];
}
