import { Component, inject, signal, OnInit, ChangeDetectionStrategy } from '@angular/core';
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
  faBook,
} from '@fortawesome/free-solid-svg-icons';
import { AuthService } from '../../core/services/auth.service';
import { ContentStore } from '../../stores/content.store';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, FontAwesomeModule],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SidebarComponent implements OnInit {
  private readonly authService = inject(AuthService);
  readonly contentStore = inject(ContentStore);

  readonly faHome = faHome;
  readonly faProjectDiagram = faProjectDiagram;
  readonly faTasks = faTasks;
  readonly faClock = faClock;
  readonly faFileInvoiceDollar = faFileInvoiceDollar;
  readonly faUsers = faUsers;
  readonly faCog = faCog;
  readonly faBars = faBars;
  readonly faBuilding = faBuilding;
  readonly faBook = faBook;

  readonly tenantName = signal('');
  readonly userRole = signal('');

  ngOnInit(): void {
    this.tenantName.set(this.authService.getTenantName());
    this.userRole.set(this.authService.getUserRole());
  }

  readonly navItems = [
    { labelKey: 'nav.dashboard', icon: faHome, route: '/dashboard' },
    { labelKey: 'nav.projects', icon: faProjectDiagram, route: '/projects' },
    { labelKey: 'nav.tasks', icon: faTasks, route: '/tasks' },
    { labelKey: 'nav.timeTracking', icon: faClock, route: '/time' },
    { labelKey: 'nav.invoices', icon: faFileInvoiceDollar, route: '/invoices' },
    { labelKey: 'nav.team', icon: faUsers, route: '/admin/users' },
    { labelKey: 'nav.docs', icon: faBook, route: '/docs' },
    { labelKey: 'nav.settings', icon: faCog, route: '/settings' },
  ];

  readonly adminNavItems = [];
}
