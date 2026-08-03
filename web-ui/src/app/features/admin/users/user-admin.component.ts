import { Component, OnInit, inject, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { UserStore, UserWithRole } from '../../../stores/user.store';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons';
import { ToastService } from '../../../core/services/toast.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-user-admin',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, FontAwesomeModule],
  templateUrl: './user-admin.component.html',
  styleUrl: './user-admin.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserAdminComponent implements OnInit {
  private readonly store = inject(UserStore);
  private readonly toast = inject(ToastService);
  private readonly authService = inject(AuthService);
  private readonly fb = inject(FormBuilder);

  readonly faEye = faEye;
  readonly faEyeSlash = faEyeSlash;

  readonly users = this.store.users;
  readonly isLoading = this.store.isLoading;
  showCreateForm = false;
  editingUserId: string | null = null;
  editingRole: string | null = null;
  readonly showPassword = signal(false);

  readonly isAdmin = computed(() => this.authService.getUserRole() === 'admin');

  readonly createUserForm: FormGroup = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
    role: ['member', Validators.required],
  });

  ngOnInit() {
    this.store.loadUsers().subscribe();
  }

  trackByUserId(index: number, user: UserWithRole): string {
    return user.id;
  }

  getRoleBadgeClass(role: string): string {
    switch (role) {
      case 'admin':
        return 'badge-primary';
      case 'manager':
        return 'badge-secondary';
      default:
        return 'badge-ghost';
    }
  }

  startEditRole(userId: string, currentRole: string) {
    this.editingUserId = userId;
    this.editingRole = currentRole;
  }

  cancelEditRole() {
    this.editingUserId = null;
    this.editingRole = null;
  }

  saveRole(userId: string) {
    if (this.editingRole) {
      this.store.updateRole(userId, this.editingRole).subscribe();
      this.cancelEditRole();
    }
  }

  toggleCreateForm() {
    this.showCreateForm = !this.showCreateForm;
    this.showPassword.set(false);
    this.createUserForm.reset({ role: 'member' });
  }

  togglePasswordVisibility() {
    this.showPassword.update((v) => !v);
  }

  createUser() {
    if (this.createUserForm.invalid) {
      this.createUserForm.markAllAsTouched();
      return;
    }

    this.store.createUser(this.createUserForm.value).subscribe({
      next: () => {
        this.toggleCreateForm();
      },
    });
  }

  deactivateUser(user: UserWithRole) {
    if (confirm(`Are you sure you want to deactivate ${user.name}?`)) {
      this.store.softDelete(user.id).subscribe();
    }
  }

  reactivateUser(user: UserWithRole) {
    this.store.reactivate(user.id).subscribe();
  }
}
