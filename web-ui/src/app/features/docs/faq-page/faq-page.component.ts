import { Component, inject, OnInit, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { FaqService, FaqHeading } from '../../../shared/services/faq.service';
import { SearchCardComponent } from '../../../shared/components/search-card/search-card.component';
import { FaqAccordionComponent } from './components/faq-accordion/faq-accordion.component';

@Component({
  selector: 'app-faq-page',
  standalone: true,
  imports: [CommonModule, FormsModule, FontAwesomeModule, SearchCardComponent, FaqAccordionComponent],
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

  onSearchChange(query: string): void {
    this.searchQuery.set(query);
  }

  onClearSearch(): void {
    this.searchQuery.set('');
  }

  onHeadingToggle(headingId: string): void {
    const expanded = new Set(this.expandedHeadings());
    if (expanded.has(headingId)) {
      expanded.delete(headingId);
    } else {
      expanded.add(headingId);
    }
    this.expandedHeadings.set(expanded);
  }

  onQuestionToggle(questionId: string): void {
    const expanded = new Set(this.expandedQuestions());
    if (expanded.has(questionId)) {
      expanded.delete(questionId);
    } else {
      expanded.add(questionId);
    }
    this.expandedQuestions.set(expanded);
  }
}
