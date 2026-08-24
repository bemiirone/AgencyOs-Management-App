import { Component, inject, signal, computed, output, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faBars, faBell, faUser, faSignOutAlt, faChevronDown, faCheck, faBuilding, faExclamationTriangle, faSyncAlt } from '@fortawesome/free-solid-svg-icons';
import { AuthService, Workspace } from '../../core/services/auth.service';
import { NotificationStore } from '../../stores/notification.store';
import { ContentStore } from '../../stores/content.store';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterLink, FontAwesomeModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeaderComponent implements OnInit {
  readonly toggleDrawer = output<void>();

  private readonly authService = inject(AuthService);
  private readonly notificationStore = inject(NotificationStore);
  private readonly router = inject(Router);
  readonly contentStore = inject(ContentStore);

  readonly faBars = faBars;
  readonly faBell = faBell;
  readonly faUser = faUser;
  readonly faSignOutAlt = faSignOutAlt;
  readonly faChevronDown = faChevronDown;
  readonly faCheck = faCheck;
  readonly faBuilding = faBuilding;
  readonly faExclamationTriangle = faExclamationTriangle;
  readonly faSyncAlt = faSyncAlt;

  private readonly toast = inject(ToastService);

  readonly userName = signal('');
  readonly userRole = signal('');
  readonly tenantName = signal('');
  readonly unreadCount = signal(0);
  readonly showNotifications = signal(false);
  readonly showWorkspaceDropdown = signal(false);
  readonly workspaces = this.authService.getWorkspacesSignal();
  readonly hasMultipleWorkspaces = computed(() => this.workspaces().length > 1);
  readonly notifications = this.notificationStore.notifications;

  ngOnInit(): void {
    const user = this.authService.getUser();
    this.userName.set(user?.name ?? 'User');
    this.userRole.set(user?.role ?? 'Member');
    this.tenantName.set(this.authService.getTenantName());

    this.notificationStore.loadNotifications().subscribe({
      next: () => {
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

  refreshNotifications(): void {
    this.notificationStore.loadNotifications().subscribe({
      next: () => {
        this.unreadCount.set(this.notificationStore.unreadCount());
      },
      error: (err) => console.error('Failed to refresh notifications:', err),
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
    if (workspace.isActive === false) {
      this.toast.warning(`Workspace "${workspace.tenantName}" is deactivated. Contact your administrator.`);
      this.showWorkspaceDropdown.set(false);
      return;
    }

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
