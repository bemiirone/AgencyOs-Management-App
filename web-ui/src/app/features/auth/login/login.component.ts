import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faEnvelope, faLock, faSpinner } from '@fortawesome/free-solid-svg-icons';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, FontAwesomeModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

  faEnvelope = faEnvelope;
  faLock = faLock;
  faSpinner = faSpinner;

  email = signal('');
  password = signal('');
  error = signal('');
  loading = signal(false);

  async onSubmit(): Promise<void> {
    this.error.set('');
    this.loading.set(true);

    try {
      await this.authService.login({
        email: this.email(),
        password: this.password(),
      });
      await this.router.navigate(['/dashboard']);
    } catch (err: any) {
      this.error.set(err.error?.message || 'Login failed. Please check your credentials.');
    } finally {
      this.loading.set(false);
    }
  }
}
