import { Component, inject, OnInit, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faChevronDown, faSearch, faTimes } from '@fortawesome/free-solid-svg-icons';
import { FaqService, FaqHeading, FaqItem } from '../../../shared/services/faq.service';

@Component({
  selector: 'app-faq-page',
  standalone: true,
  imports: [CommonModule, FormsModule, FontAwesomeModule],
  templateUrl: './faq-page.component.html',
  styleUrl: './faq-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FaqPageComponent implements OnInit {
  readonly faqHeadings = signal<FaqHeading[]>([]);
  readonly loading = signal(true);
  readonly expandedHeadings = signal<Set<string>>(new Set());
  readonly expandedQuestions = signal<Set<string>>(new Set());
  readonly searchQuery = signal('');
  readonly faChevronDown = faChevronDown;
  readonly faSearch = faSearch;
  readonly faTimes = faTimes;

  private readonly faqService = inject(FaqService);

  readonly filteredFaqs = computed(() => {
    const query = this.searchQuery().toLowerCase().trim();
    const faqs = this.faqHeadings();
    
    if (!query) {
      return faqs;
    }
    
    return faqs
      .map(heading => {
        const headingMatch = heading.title.toLowerCase().includes(query);
        const hasMatchingItems = heading.items.some(
          item => item.question.toLowerCase().includes(query) || 
                  item.answer.toLowerCase().includes(query)
        );
        
        if (headingMatch || hasMatchingItems) {
          return heading;
        }
        return null;
      })
      .filter((heading): heading is FaqHeading => heading !== null);
  });

  readonly resultCount = computed(() => {
    const query = this.searchQuery().toLowerCase().trim();
    if (!query) return 0;
    
    return this.filteredFaqs().reduce((count, heading) => {
      const matchingItems = heading.items.filter(item =>
        item.question.toLowerCase().includes(query) || 
        item.answer.toLowerCase().includes(query)
      );
      return count + matchingItems.length;
    }, 0);
  });

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

  isItemVisible(item: FaqItem): boolean {
    const query = this.searchQuery().toLowerCase().trim();
    if (!query) return true;
    return item.question.toLowerCase().includes(query) || 
           item.answer.toLowerCase().includes(query);
  }

  clearSearch(): void {
    this.searchQuery.set('');
  }

  highlightText(text: string): string {
    const query = this.searchQuery().trim();
    if (!query || !text) return text;
    const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${escapedQuery})`, 'gi');
    return text.replace(regex, '<mark class="bg-yellow-200 px-0.5 rounded">$1</mark>');
  }

  trackByHeadingId(_index: number, heading: FaqHeading): string {
    return heading._id;
  }

  trackByQuestionIndex(index: number): number {
    return index;
  }
}
