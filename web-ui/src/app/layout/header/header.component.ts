import { Component, inject, signal, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faBars, faBell, faUser, faSignOutAlt, faChevronDown } from '@fortawesome/free-solid-svg-icons';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, FontAwesomeModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
})
export class HeaderComponent {
  @Output() toggleDrawer = new EventEmitter<void>();

  private authService = inject(AuthService);

  faBars = faBars;
  faBell = faBell;
  faUser = faUser;
  faSignOutAlt = faSignOutAlt;
  faChevronDown = faChevronDown;

  userName = signal('');
  userRole = signal('');

  constructor() {
    const user = this.authService.getUser();
    this.userName.set(user?.name ?? 'User');
    this.userRole.set(user?.role ?? 'Member');
  }

  onToggleDrawer(): void {
    this.toggleDrawer.emit();
  }

  async onLogout(): Promise<void> {
    await this.authService.logout();
  }
}
