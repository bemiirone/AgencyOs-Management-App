import { Component, inject, OnInit, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faChevronDown } from '@fortawesome/free-solid-svg-icons';
import { FaqService, FaqHeading, FaqItem } from '../../../shared/services/faq.service';

@Component({
  selector: 'app-faq-page',
  standalone: true,
  imports: [CommonModule, FontAwesomeModule],
  templateUrl: './faq-page.component.html',
  styleUrl: './faq-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FaqPageComponent implements OnInit {
  readonly faqHeadings = signal<FaqHeading[]>([]);
  readonly loading = signal(true);
  readonly expandedHeadings = signal<Set<string>>(new Set());
  readonly expandedQuestions = signal<Set<string>>(new Set());
  readonly faChevronDown = faChevronDown;

  private readonly faqService = inject(FaqService);

  async ngOnInit(): Promise<void> {
    console.log('FaqPageComponent ngOnInit called');
    try {
      const faqs = await this.faqService.getFaqs();
      this.faqHeadings.set(faqs);
      if (faqs.length > 0) {
        const expanded = new Set<string>();
        expanded.add(faqs[0]._id);
        this.expandedHeadings.set(expanded);
      }
    } catch (error) {
      console.error('Failed to load FAQs:', error);
    } finally {
      this.loading.set(false);
    }
  }

  toggleHeading(headingId: string): void {
    const expanded = new Set(this.expandedHeadings());
    if (expanded.has(headingId)) {
      expanded.delete(headingId);
    } else {
      expanded.add(headingId);
    }
    this.expandedHeadings.set(expanded);
  }

  toggleQuestion(questionId: string): void {
    const expanded = new Set(this.expandedQuestions());
    if (expanded.has(questionId)) {
      expanded.delete(questionId);
    } else {
      expanded.add(questionId);
    }
    this.expandedQuestions.set(expanded);
  }

  isHeadingExpanded(headingId: string): boolean {
    return this.expandedHeadings().has(headingId);
  }

  isQuestionExpanded(questionId: string): boolean {
    return this.expandedQuestions().has(questionId);
  }

  trackByHeadingId(_index: number, heading: FaqHeading): string {
    return heading._id;
  }

  trackByQuestionIndex(index: number): number {
    return index;
  }
}
