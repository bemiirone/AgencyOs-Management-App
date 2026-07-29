import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faUser, faEnvelope, faLock, faSpinner, faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, FontAwesomeModule],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss',
})
export class RegisterComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

  faUser = faUser;
  faEnvelope = faEnvelope;
  faLock = faLock;
  faSpinner = faSpinner;
  faEye = faEye;
  faEyeSlash = faEyeSlash;

  name = signal('');
  email = signal('');
  password = signal('');
  confirmPassword = signal('');
  error = signal('');
  loading = signal(false);
  showPassword = signal(false);
  showConfirmPassword = signal(false);

  togglePasswordVisibility(): void {
    this.showPassword.update((v) => !v);
  }

  toggleConfirmPasswordVisibility(): void {
    this.showConfirmPassword.update((v) => !v);
  }

  passwordsMatch(): boolean {
    return this.password() === this.confirmPassword() && this.password().length > 0;
  }

  async onSubmit(): Promise<void> {
    this.error.set('');

    if (!this.passwordsMatch()) {
      this.error.set('Passwords do not match');
      return;
    }

    this.loading.set(true);

    try {
      await this.authService.register({
        name: this.name(),
        email: this.email(),
        password: this.password(),
      });
      await this.router.navigate(['/dashboard']);
    } catch (err: any) {
      this.error.set(err.error?.message || 'Registration failed. Please try again.');
    } finally {
      this.loading.set(false);
    }
  }
}
