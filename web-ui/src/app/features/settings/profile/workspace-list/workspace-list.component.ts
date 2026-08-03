import { Component, input, output, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faBuilding, faPlus } from '@fortawesome/free-solid-svg-icons';
import { Workspace } from '../../../../core/services/auth.service';
import { JoinWorkspaceComponent } from './join-workspace/join-workspace.component';

@Component({
  selector: 'app-workspace-list',
  standalone: true,
  imports: [CommonModule, FontAwesomeModule, JoinWorkspaceComponent],
  templateUrl: './workspace-list.component.html',
  styleUrl: './workspace-list.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WorkspaceListComponent {
  readonly workspaces = input.required<Workspace[]>();
  readonly joined = output<void>();

  readonly faBuilding = faBuilding;
  readonly faPlus = faPlus;

  readonly showJoinDialog = signal(false);

  onJoined() {
    this.showJoinDialog.set(false);
    this.joined.emit();
  }
}
