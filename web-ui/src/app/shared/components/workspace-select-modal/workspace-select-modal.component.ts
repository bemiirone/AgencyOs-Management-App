import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faCheck, faBuilding, faSpinner } from '@fortawesome/free-solid-svg-icons';
import { AuthService, Workspace } from '../../../core/services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-workspace-select-modal',
  standalone: true,
  imports: [CommonModule, FontAwesomeModule],
  templateUrl: './workspace-select-modal.component.html',
  styleUrl: './workspace-select-modal.component.css',
})
export class WorkspaceSelectModalComponent implements OnInit {
  private authService = inject(AuthService);
  private router = inject(Router);

  faCheck = faCheck;
  faBuilding = faBuilding;
  faSpinner = faSpinner;

  workspaces: Workspace[] = [];
  loading = false;

  async ngOnInit() {
    try {
      this.workspaces = await this.authService.getWorkspaces();
    } catch {
      this.workspaces = this.authService.getWorkspacesSignal()() || [];
    }
  }

  async selectWorkspace(workspace: Workspace) {
    this.loading = true;
    try {
      await this.authService.switchWorkspace(workspace.tenantId);
      window.location.reload();
    } catch {
      this.loading = false;
    }
  }

  async skipSelection() {
    this.authService.setShowWorkspaceSelect(false);
  }
}
