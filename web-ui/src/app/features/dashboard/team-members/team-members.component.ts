import { Component, input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TeamMember } from '../dashboard.models';

@Component({
  selector: 'app-team-members',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './team-members.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TeamMembersComponent {
  members = input.required<TeamMember[]>();
}
