import { Component, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faEnvelope, faLock, faSpinner, faEye, faEyeSlash, faBuilding, faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import { AuthService, Workspace } from '../../../core/services/auth.service';
import { ModalComponent } from '../../../shared/components/modal/modal.component';
import { ContentStore } from '../../../stores/content.store';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, FontAwesomeModule, ModalComponent],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  readonly contentStore = inject(ContentStore);

  readonly faEnvelope = faEnvelope;
  readonly faLock = faLock;
  readonly faSpinner = faSpinner;
  readonly faEye = faEye;
  readonly faEyeSlash = faEyeSlash;
  readonly faBuilding = faBuilding;
  readonly faArrowLeft = faArrowLeft;

  readonly email = signal('');
  readonly password = signal('');
  readonly error = signal('');
  readonly loading = signal(false);
  readonly showPassword = signal(false);
  
  readonly stage = signal<1 | 2>(1);
  readonly workspacesFromLogin = signal<Workspace[]>([]);
  readonly selectedWorkspaceId = signal('');
  readonly showDeactivatedModal = signal(false);
  readonly deactivatedWorkspaceName = signal('');

  togglePasswordVisibility(): void {
    this.showPassword.update((v) => !v);
  }

  async onSubmit(): Promise<void> {
    if (this.stage() === 1) {
      await this.handleStage1();
    } else {
      await this.handleStage2();
    }
  }

  private async handleStage1(): Promise<void> {
    this.error.set('');
    this.loading.set(true);

    try {
      const response = await this.authService.login({
        email: this.email(),
        password: this.password(),
      });

      if (response.requiresWorkspaceSelection && response.workspaces) {
        this.workspacesFromLogin.set(response.workspaces);
        
        const lastWorkspace = this.authService.getWorkspacesSignal()().find(w => w.isLastUsed);
        if (lastWorkspace) {
          this.selectedWorkspaceId.set(lastWorkspace.tenantId);
        } else {
          this.selectedWorkspaceId.set(response.workspaces[0].tenantId);
        }
        
        this.stage.set(2);
      } else {
        await this.router.navigate(['/dashboard']);
      }
    } catch (err: unknown) {
      this.handleError(err);
    } finally {
      this.loading.set(false);
    }
  }

  private async handleStage2(): Promise<void> {
    this.error.set('');
    this.loading.set(true);

    const selectedWorkspace = this.workspacesFromLogin().find(w => w.tenantId === this.selectedWorkspaceId());
    if (selectedWorkspace && selectedWorkspace.isActive === false) {
      this.deactivatedWorkspaceName.set(selectedWorkspace.tenantName);
      this.showDeactivatedModal.set(true);
      this.loading.set(false);
      return;
    }

    try {
      await this.authService.switchWorkspace(this.selectedWorkspaceId());
      await this.router.navigate(['/dashboard']);
    } catch (err: unknown) {
      this.handleError(err);
    } finally {
      this.loading.set(false);
    }
  }

  goBackToStage1(): void {
    this.stage.set(1);
    this.workspacesFromLogin.set([]);
    this.selectedWorkspaceId.set('');
    this.error.set('');
  }

  private handleError(err: unknown): void {
    const message = err instanceof Error ? err.message : 'Login failed. Please check your credentials.';
    
    if (message.includes('has been deactivated')) {
      const match = message.match(/Workspace "(.+?)" has been deactivated/);
      this.deactivatedWorkspaceName.set(match?.[1] || 'Unknown');
      this.showDeactivatedModal.set(true);
      this.error.set('');
    } else {
      this.error.set(message);
    }
  }

  closeDeactivatedModal(): void {
    this.showDeactivatedModal.set(false);
    this.deactivatedWorkspaceName.set('');
  }
}
