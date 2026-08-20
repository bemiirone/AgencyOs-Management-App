import { Component, input, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { Activity } from '../dashboard.models';
import { ContentCardComponent } from '../../../shared/components/content-card/content-card.component';
import { ContentStore } from '../../../stores/content.store';

@Component({
  selector: 'app-recent-activity',
  standalone: true,
  imports: [CommonModule, FontAwesomeModule, ContentCardComponent],
  templateUrl: './recent-activity.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RecentActivityComponent {
  private contentStore = inject(ContentStore);
  activities = input.required<Activity[]>();
  title = this.contentStore.content('dashboard.recentActivity.title');
  emptyMessage = this.contentStore.content('dashboard.recentActivity.empty');
}
