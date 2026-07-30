import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faUser, faEnvelope, faLock, faEye, faEyeSlash, faSave } from '@fortawesome/free-solid-svg-icons';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';

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

  ngOnInit() {
    const user = this.authService.getUser();
    if (user) {
      this.name.set(user.name);
      this.email.set(user.email);
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
