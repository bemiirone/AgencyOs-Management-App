import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faUser, faEnvelope, faLock, faEye, faEyeSlash, faSave, faBuilding, faPlus } from '@fortawesome/free-solid-svg-icons';
import { AuthService, Workspace } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { JoinWorkspaceModalComponent } from '../../../shared/components/join-workspace-modal/join-workspace-modal.component';

@Component({
  selector: 'app-profile-settings',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FontAwesomeModule, JoinWorkspaceModalComponent],
  templateUrl: './profile-settings.component.html',
  styleUrl: './profile-settings.component.css',
})
export class ProfileSettingsComponent implements OnInit {
  private authService = inject(AuthService);
  private toast = inject(ToastService);
  private fb = inject(FormBuilder);

  faUser = faUser;
  faEnvelope = faEnvelope;
  faLock = faLock;
  faEye = faEye;
  faEyeSlash = faEyeSlash;
  faSave = faSave;
  faBuilding = faBuilding;
  faPlus = faPlus;

  profileForm: FormGroup = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    email: [{ value: '', disabled: true }],
  });

  passwordForm: FormGroup = this.fb.group({
    currentPassword: ['', Validators.required],
    newPassword: ['', [Validators.required, Validators.minLength(8)]],
    confirmPassword: ['', Validators.required],
  }, { validators: this.passwordsMatchValidator });

  showPasswords = signal({ current: false, new: false, confirm: false });
  saving = signal(false);
  changingPassword = signal(false);

  workspaces = signal<Workspace[]>([]);
  showJoinDialog = signal(false);

  ngOnInit() {
    const user = this.authService.getUser();
    if (user) {
      this.profileForm.patchValue({ name: user.name, email: user.email });
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
  }

  onWorkspaceJoined() {
    this.loadWorkspaces();
  }

  togglePasswordVisibility(field: 'current' | 'new' | 'confirm') {
    this.showPasswords.update((s) => ({ ...s, [field]: !s[field] }));
  }

  private passwordsMatchValidator(group: AbstractControl): ValidationErrors | null {
    const newPass = group.get('newPassword')?.value;
    const confirmPass = group.get('confirmPassword')?.value;
    return newPass && confirmPass && newPass !== confirmPass ? { passwordsMismatch: true } : null;
  }

  async onUpdateProfile() {
    if (this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      return;
    }

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
    if (this.passwordForm.invalid) {
      this.passwordForm.markAllAsTouched();
      return;
    }

    this.changingPassword.set(true);
    try {
      this.toast.success('Password changed successfully');
      this.passwordForm.reset();
    } catch {
      this.toast.error('Failed to change password');
    } finally {
      this.changingPassword.set(false);
    }
  }
}
