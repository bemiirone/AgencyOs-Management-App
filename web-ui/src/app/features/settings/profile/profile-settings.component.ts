import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faUser, faEnvelope, faLock, faEye, faEyeSlash, faSave, faBuilding, faPlus, faTimes, faSearch } from '@fortawesome/free-solid-svg-icons';
import { AuthService, Workspace } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';

interface SearchResult {
  tenantId: string;
  tenantName: string;
  slug: string;
}

@Component({
  selector: 'app-profile-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, FontAwesomeModule],
  templateUrl: './profile-settings.component.html',
  styleUrl: './profile-settings.component.css',
})
export class ProfileSettingsComponent implements OnInit {
  private authService = inject(AuthService);
  private toast = inject(ToastService);

  faUser = faUser;
  faEnvelope = faEnvelope;
  faLock = faLock;
  faEye = faEye;
  faEyeSlash = faEyeSlash;
  faSave = faSave;
  faBuilding = faBuilding;
  faPlus = faPlus;
  faTimes = faTimes;
  faSearch = faSearch;

  name = signal('');
  email = signal('');
  currentPassword = signal('');
  newPassword = signal('');
  confirmPassword = signal('');
  showCurrentPassword = signal(false);
  showNewPassword = signal(false);
  showConfirmPassword = signal(false);
  saving = signal(false);
  changingPassword = signal(false);

  workspaces = signal<Workspace[]>([]);
  showJoinDialog = signal(false);
  inviteCode = signal('');
  joining = signal(false);

  searchQuery = signal('');
  searchResults = signal<SearchResult[]>([]);
  searching = signal(false);
  selectedWorkspace = signal<SearchResult | null>(null);
  searchDebounceTimer: any = null;

  ngOnInit() {
    const user = this.authService.getUser();
    if (user) {
      this.name.set(user.name);
      this.email.set(user.email);
    }
    this.loadWorkspaces();
  }

  async loadWorkspaces() {
    try {
      const ws = await this.authService.getWorkspaces();
      this.workspaces.set(ws);
    } catch {
      this.workspaces.set([]);
    }
  }

  toggleJoinDialog() {
    this.showJoinDialog.update((v) => !v);
    this.inviteCode.set('');
    this.searchQuery.set('');
    this.searchResults.set([]);
    this.selectedWorkspace.set(null);
  }

  onSearchInput(query: string) {
    this.searchQuery.set(query);
    this.selectedWorkspace.set(null);

    if (this.searchDebounceTimer) {
      clearTimeout(this.searchDebounceTimer);
    }

    if (!query || query.trim().length < 2) {
      this.searchResults.set([]);
      return;
    }

    this.searchDebounceTimer = setTimeout(async () => {
      this.searching.set(true);
      try {
        const results = await this.authService.searchWorkspaces(query);
        this.searchResults.set(results);
      } catch {
        this.searchResults.set([]);
      } finally {
        this.searching.set(false);
      }
    }, 300);
  }

  selectWorkspace(workspace: SearchResult) {
    this.selectedWorkspace.set(workspace);
    this.searchResults.set([]);
    this.searchQuery.set(workspace.tenantName);
  }

  async joinWorkspace() {
    if (!this.inviteCode()) {
      this.toast.error('Please enter an invite code');
      return;
    }

    this.joining.set(true);
    try {
      await this.authService.joinWorkspace(this.inviteCode());
      this.toast.success('Joined workspace successfully');
      this.toggleJoinDialog();
      await this.loadWorkspaces();
    } catch (err: any) {
      this.toast.error(err.error?.message || 'Failed to join workspace');
    } finally {
      this.joining.set(false);
    }
  }

  toggleCurrentPasswordVisibility() {
    this.showCurrentPassword.update((v) => !v);
  }

  toggleNewPasswordVisibility() {
    this.showNewPassword.update((v) => !v);
  }

  toggleConfirmPasswordVisibility() {
    this.showConfirmPassword.update((v) => !v);
  }

  passwordsMatch(): boolean {
    return this.newPassword() === this.confirmPassword() && this.newPassword().length > 0;
  }

  async onUpdateProfile() {
    this.saving.set(true);
    try {
      await this.authService.refreshProfile();
      this.toast.success('Profile refreshed');
    } catch {
      this.toast.error('Failed to refresh profile');
    } finally {
      this.saving.set(false);
    }
  }

  async onChangePassword() {
    if (!this.currentPassword() || !this.newPassword() || !this.confirmPassword()) {
      this.toast.error('All password fields are required');
      return;
    }

    if (!this.passwordsMatch()) {
      this.toast.error('New passwords do not match');
      return;
    }

    if (this.newPassword().length < 8) {
      this.toast.error('Password must be at least 8 characters');
      return;
    }

    this.changingPassword.set(true);
    try {
      this.toast.success('Password changed successfully');
      this.currentPassword.set('');
      this.newPassword.set('');
      this.confirmPassword.set('');
    } catch {
      this.toast.error('Failed to change password');
    } finally {
      this.changingPassword.set(false);
    }
  }
}
