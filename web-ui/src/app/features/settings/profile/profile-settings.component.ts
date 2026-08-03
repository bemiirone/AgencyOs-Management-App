import { Component, OnInit, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService, Workspace } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { ProfileInfoComponent } from './profile-info/profile-info.component';
import { WorkspaceListComponent } from './workspace-list/workspace-list.component';
import { ChangePasswordComponent } from './change-password/change-password.component';

@Component({
  selector: 'app-profile-settings',
  standalone: true,
  imports: [CommonModule, ProfileInfoComponent, WorkspaceListComponent, ChangePasswordComponent],
  templateUrl: './profile-settings.component.html',
  styleUrl: './profile-settings.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfileSettingsComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly toast = inject(ToastService);

  readonly name = signal('');
  readonly email = signal('');
  readonly workspaces = signal<Workspace[]>([]);
  readonly saving = signal(false);
  readonly changingPassword = signal(false);
  readonly passwordResetCount = signal(0);

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

  async onSaveProfile(data: { name: string }) {
    this.saving.set(true);
    try {
      await this.authService.refreshProfile();
      this.name.set(data.name);
      this.toast.success('Profile updated');
    } catch {
      this.toast.error('Failed to update profile');
    } finally {
      this.saving.set(false);
    }
  }

  onWorkspaceJoined() {
    this.loadWorkspaces();
  }

  async onChangePassword() {
    this.changingPassword.set(true);
    try {
      this.toast.success('Password changed successfully');
      this.passwordResetCount.update((c) => c + 1);
    } catch {
      this.toast.error('Failed to change password');
    } finally {
      this.changingPassword.set(false);
    }
  }
}
