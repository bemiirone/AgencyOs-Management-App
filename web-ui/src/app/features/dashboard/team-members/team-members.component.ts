import { Component, input, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TeamMember } from '../dashboard.models';
import { ContentCardComponent } from '../../../shared/components/content-card/content-card.component';
import { ContentStore } from '../../../stores/content.store';

@Component({
  selector: 'app-team-members',
  standalone: true,
  imports: [CommonModule, ContentCardComponent],
  templateUrl: './team-members.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TeamMembersComponent {
  private contentStore = inject(ContentStore);
  members = input.required<TeamMember[]>();
  title = this.contentStore.content('dashboard.teamMembers.title');
  emptyMessage = this.contentStore.content('dashboard.teamMembers.empty');
}
