import { Component, input, output, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faSearch, faTimes } from '@fortawesome/free-solid-svg-icons';
import { IconDefinition } from '@fortawesome/angular-fontawesome';

@Component({
  selector: 'app-search-card',
  standalone: true,
  imports: [CommonModule, FormsModule, FontAwesomeModule],
  templateUrl: './search-card.component.html',
  styleUrl: './search-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SearchCardComponent {
  readonly placeholder = input<string>('Search...');
  readonly searchQuery = input.required<string>();
  readonly resultCount = input<number>(0);
  readonly icon = input<IconDefinition>(faSearch);
  readonly variant = input<'card' | 'flat'>('card');
  readonly hasCount = input<boolean>(true);

  readonly searchChange = output<string>();
  readonly clear = output<void>();

  readonly faSearch = faSearch;
  readonly faTimes = faTimes;

  onSearchChange(value: string): void {
    this.searchChange.emit(value);
  }

  onClear(): void {
    this.clear.emit();
  }
}
