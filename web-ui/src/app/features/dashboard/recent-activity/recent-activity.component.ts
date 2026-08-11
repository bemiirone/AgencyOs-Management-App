import { Component, input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { Activity } from '../dashboard.models';
import { ContentCardComponent } from '../../../shared/components/content-card/content-card.component';

@Component({
  selector: 'app-recent-activity',
  standalone: true,
  imports: [CommonModule, FontAwesomeModule, ContentCardComponent],
  templateUrl: './recent-activity.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RecentActivityComponent {
  activities = input.required<Activity[]>();
}
