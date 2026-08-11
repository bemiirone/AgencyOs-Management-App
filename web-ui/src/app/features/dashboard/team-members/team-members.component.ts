import { Component, input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TeamMember } from '../dashboard.models';
import { ContentCardComponent } from '../../../shared/components/content-card/content-card.component';

@Component({
  selector: 'app-team-members',
  standalone: true,
  imports: [CommonModule, ContentCardComponent],
  templateUrl: './team-members.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TeamMembersComponent {
  members = input.required<TeamMember[]>();
}
