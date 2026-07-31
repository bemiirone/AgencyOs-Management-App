import { Component, input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { IconDefinition } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-stat-card',
  standalone: true,
  imports: [CommonModule, FontAwesomeModule],
  templateUrl: './stat-card.component.html',
  styleUrl: './stat-card.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StatCardComponent {
  icon = input.required<IconDefinition>();
  value = input.required<number>();
  title = input.required<string>();
  description = input.required<string>();
  colorClass = input.required<string>();
}
