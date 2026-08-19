import { Component, input, output, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faChevronDown } from '@fortawesome/free-solid-svg-icons';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { FaqHeading, FaqItem } from '../../../../../shared/services/faq.service';

@Component({
  selector: 'app-faq-accordion',
  standalone: true,
  imports: [CommonModule, FontAwesomeModule],
  templateUrl: './faq-accordion.component.html',
  styleUrl: './faq-accordion.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FaqAccordionComponent {
  readonly faqs = input.required<FaqHeading[]>();
  readonly searchQuery = input.required<string>();
  readonly expandedHeadings = input.required<Set<string>>();
  readonly expandedQuestions = input.required<Set<string>>();

  readonly headingToggle = output<string>();
  readonly questionToggle = output<string>();

  readonly faChevronDown = faChevronDown;

  constructor(private sanitizer: DomSanitizer) { }

  onHeadingToggle(headingId: string): void {
    this.headingToggle.emit(headingId);
  }

  onQuestionToggle(questionId: string): void {
    this.questionToggle.emit(questionId);
  }

  isHeadingExpanded(headingId: string): boolean {
    return this.expandedHeadings().has(headingId);
  }

  isQuestionExpanded(questionId: string): boolean {
    return this.expandedQuestions().has(questionId);
  }

  isItemVisible(item: FaqItem): boolean {
    const query = this.searchQuery().toLowerCase().trim();
    if (!query) return true;
    return item.question.toLowerCase().includes(query) ||
      item.answer.toLowerCase().includes(query);
  }

  highlightText(text: string): SafeHtml {
    const query = this.searchQuery().trim();
    if (!query || !text) return this.sanitizer.bypassSecurityTrustHtml(text);
    const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${escapedQuery})`, 'gi');
    const highlighted = text.replace(regex, '<mark class="bg-yellow-200 px-0.5 rounded">$1</mark>');
    return this.sanitizer.bypassSecurityTrustHtml(highlighted);
  }

  sanitizeHtml(html: string): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(html);
  }

  trackByHeadingId(_index: number, heading: FaqHeading): string {
    return heading._id;
  }

  trackByQuestionIndex(index: number): number {
    return index;
  }
}
