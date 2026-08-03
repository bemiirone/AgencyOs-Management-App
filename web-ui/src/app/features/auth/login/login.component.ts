import { Component, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faEnvelope, faLock, faSpinner, faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, FontAwesomeModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly faEnvelope = faEnvelope;
  readonly faLock = faLock;
  readonly faSpinner = faSpinner;
  readonly faEye = faEye;
  readonly faEyeSlash = faEyeSlash;

  readonly email = signal('');
  readonly password = signal('');
  readonly error = signal('');
  readonly loading = signal(false);
  readonly showPassword = signal(false);

  togglePasswordVisibility(): void {
    this.showPassword.update((v) => !v);
  }

  async onSubmit(): Promise<void> {
    this.error.set('');
    this.loading.set(true);

    try {
      await this.authService.login({
        email: this.email(),
        password: this.password(),
      });
      await this.router.navigate(['/dashboard']);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Login failed. Please check your credentials.';
      this.error.set(message);
    } finally {
      this.loading.set(false);
    }
  }
}
