import { Component, input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { IconDefinition } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-content-card',
  standalone: true,
  imports: [CommonModule, FontAwesomeModule],
  templateUrl: './content-card.component.html',
  styleUrl: './content-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ContentCardComponent {
  title = input<string>();
  icon = input<IconDefinition>();
  titleClass = input<string>();
  cardClass = input<string>();
  cardBodyClass = input<string>();
}
