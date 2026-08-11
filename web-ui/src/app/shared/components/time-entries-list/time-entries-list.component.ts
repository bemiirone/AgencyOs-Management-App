import { Component, input, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faClock } from '@fortawesome/free-solid-svg-icons';
import { TimeEntry } from '../../../shared/models/time-entry.model';
import { TimeEntryStore } from '../../../stores/time-entry.store';

@Component({
  selector: 'app-time-entries-list',
  standalone: true,
  imports: [CommonModule, FontAwesomeModule],
  templateUrl: './time-entries-list.component.html',
  styleUrl: './time-entries-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TimeEntriesListComponent {
  private readonly timeEntryStore = inject(TimeEntryStore);

  readonly entries = input.required<TimeEntry[]>();
  readonly limit = input<number>();
  readonly showBillable = input<boolean>(true);
  readonly showTaskRef = input<boolean>(false);
  readonly showEmptyState = input<boolean>(true);

  readonly faClock = faClock;

  get displayEntries(): TimeEntry[] {
    const entries = this.entries();
    const limit = this.limit();
    return limit ? entries.slice(0, limit) : entries;
  }

  formatDate(date: string | Date | undefined): string {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString();
  }

  formatDuration(duration: number): string {
    return this.timeEntryStore.formatDuration(duration);
  }
}
