import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserStore, UserWithRole, CreateUserDto } from '../../../stores/user.store';
import { FormsModule } from '@angular/forms';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-user-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './user-admin.component.html',
  styleUrl: './user-admin.component.css',
})
export class UserAdminComponent implements OnInit {
  private store = inject(UserStore);
  private toast = inject(ToastService);

  users = this.store.users;
  isLoading = this.store.isLoading;
  showCreateForm = false;
  editingUserId: string | null = null;
  editingRole: string | null = null;

  newUser: CreateUserDto = { name: '', email: '', password: '', role: 'member' };

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
    if (!this.showCreateForm) {
      this.newUser = { name: '', email: '', password: '', role: 'member' };
    }
  }

  createUser() {
    if (!this.newUser.name || !this.newUser.email || !this.newUser.password) {
      this.toast.error('All fields are required');
      return;
    }

    this.store.createUser(this.newUser).subscribe({
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
