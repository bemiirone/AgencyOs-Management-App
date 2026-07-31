import { Component, inject, signal, computed, Output, EventEmitter, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faBars, faBell, faUser, faSignOutAlt, faChevronDown, faCheck, faBuilding } from '@fortawesome/free-solid-svg-icons';
import { AuthService, Workspace } from '../../core/services/auth.service';
import { NotificationStore } from '../../stores/notification.store';
import { Notification } from '../../shared/models/notification.model';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterLink, FontAwesomeModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeaderComponent implements OnInit {
  @Output() toggleDrawer = new EventEmitter<void>();

  private authService = inject(AuthService);
  private notificationStore = inject(NotificationStore);
  private router = inject(Router);

  faBars = faBars;
  faBell = faBell;
  faUser = faUser;
  faSignOutAlt = faSignOutAlt;
  faChevronDown = faChevronDown;
  faCheck = faCheck;
  faBuilding = faBuilding;

  userName = signal('');
  userRole = signal('');
  tenantName = signal('');
  notifications = signal<Notification[]>([]);
  unreadCount = signal(0);
  showNotifications = signal(false);
  showWorkspaceDropdown = signal(false);
  workspaces = this.authService.getWorkspacesSignal();
  hasMultipleWorkspaces = computed(() => this.workspaces().length > 1);

  ngOnInit(): void {
    const user = this.authService.getUser();
    this.userName.set(user?.name ?? 'User');
    this.userRole.set(user?.role ?? 'Member');
    this.tenantName.set(this.authService.getTenantName());

    this.notificationStore.loadNotifications().subscribe({
      next: (notifications) => {
        this.notifications.set(notifications);
        this.unreadCount.set(this.notificationStore.unreadCount());
      },
      error: (err) => console.error('Failed to load notifications:', err),
    });

    this.loadWorkspaces();
  }

  async loadWorkspaces() {
    await this.authService.getWorkspaces();
  }

  toggleNotifications(): void {
    this.showNotifications.update((v) => !v);
    this.showWorkspaceDropdown.set(false);
  }

  toggleWorkspaceDropdown(): void {
    this.showWorkspaceDropdown.update((v) => !v);
    this.showNotifications.set(false);
  }

  markAsRead(id: string): void {
    this.notificationStore.markAsRead(id).subscribe({
      next: () => {
        this.unreadCount.set(this.notificationStore.unreadCount());
      },
      error: (err) => console.error('Failed to mark notification as read:', err),
    });
  }

  timeAgo(date: Date | string): string {
    const now = new Date();
    const then = new Date(date);
    const diffMs = now.getTime() - then.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  }

  async switchWorkspace(workspace: Workspace) {
    this.showWorkspaceDropdown.set(false);
    await this.authService.switchWorkspace(workspace.tenantId);
    this.tenantName.set(workspace.tenantName);
    window.location.reload();
  }

  onToggleDrawer(): void {
    this.toggleDrawer.emit();
  }

  async onLogout(): Promise<void> {
    await this.authService.logout();
  }
}
