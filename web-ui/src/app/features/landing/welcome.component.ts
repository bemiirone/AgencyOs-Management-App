import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import {
  faClock,
  faPaperPlane,
  faCreditCard,
  faUsers,
  faChartLine,
  faEnvelope,
  faFileInvoiceDollar,
  faDoorOpen,
  faMagnifyingGlassChart,
  faStar,
  faCheck,
  faCircleQuestion,
  faBolt,
  faShieldHalved,
  faArrowDown,
} from '@fortawesome/free-solid-svg-icons';
import { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import { ContentStore } from '../../stores/content.store';
import { LandingService, LandingSectionEntry } from '../../services/landing.service';
import { DashboardMockupComponent } from './components/dashboard-mockup/dashboard-mockup.component';

interface PainPoint {
  icon: IconDefinition;
  title: string;
  description: string;
}

interface ValueProp {
  icon: IconDefinition;
  title: string;
  description: string;
}

interface Step {
  number: number;
  title: string;
  description: string;
}

interface Feature {
  icon: IconDefinition;
  title: string;
  description: string;
}

interface Testimonial {
  quote: string;
  name: string;
  role: string;
  rating: number;
}

interface FaqItem {
  question: string;
  answer: string;
}

@Component({
  selector: 'app-welcome',
  standalone: true,
  imports: [CommonModule, RouterLink, FontAwesomeModule, DashboardMockupComponent],
  templateUrl: './welcome.component.html',
  styleUrl: './welcome.component.scss',
})
export class WelcomeComponent implements OnInit {
  readonly contentStore = inject(ContentStore);
  private landingService = inject(LandingService);

  readonly faStar = faStar;
  readonly faCheck = faCheck;
  readonly faArrowDown = faArrowDown;

  readonly iconMap: Record<string, IconDefinition> = {
    faClock,
    faPaperPlane,
    faCreditCard,
    faUsers,
    faChartLine,
    faEnvelope,
    faFileInvoiceDollar,
    faDoorOpen,
    faMagnifyingGlassChart,
    faStar,
    faCheck,
    faCircleQuestion,
    faBolt,
    faShieldHalved,
    faArrowDown,
  };

  painPoints: PainPoint[] = [];
  valueProps: ValueProp[] = [];
  steps: Step[] = [];
  features: Feature[] = [];
  testimonials: Testimonial[] = [];
  faqs: FaqItem[] = [];
  isLoading = signal(true);

  ngOnInit(): void {
    this.loadLandingData();
  }

  private loadLandingData(): void {
    this.isLoading.set(true);
    this.landingService.getAll().subscribe({
      next: (sections) => {
        try {
          this.painPoints = this.mapToPainPoints(sections);
          this.valueProps = this.mapToValueProps(sections);
          this.steps = this.mapToSteps(sections);
          this.features = this.mapToFeatures(sections);
          this.testimonials = this.mapToTestimonials(sections);
          this.faqs = this.mapToFaqs(sections);
        } catch (err) {
          console.error('Error mapping landing data:', err);
        }
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Failed to load landing data:', err);
        this.isLoading.set(false);
      },
    });
  }

  private mapToPainPoints(sections: LandingSectionEntry[]): PainPoint[] {
    return sections
      .filter(s => s.section === 'painPoints' && s.isActive)
      .sort((a, b) => a.order - b.order)
      .map(s => ({
        icon: this.iconMap[s.icon || 'faEnvelope'] || faEnvelope,
        title: s.title || '',
        description: s.description || '',
      }));
  }

  private mapToValueProps(sections: LandingSectionEntry[]): ValueProp[] {
    return sections
      .filter(s => s.section === 'valueProps' && s.isActive)
      .sort((a, b) => a.order - b.order)
      .map(s => ({
        icon: this.iconMap[s.icon || 'faFileInvoiceDollar'] || faFileInvoiceDollar,
        title: s.title || '',
        description: s.description || '',
      }));
  }

  private mapToSteps(sections: LandingSectionEntry[]): Step[] {
    return sections
      .filter(s => s.section === 'steps' && s.isActive)
      .sort((a, b) => a.order - b.order)
      .map((s, i) => ({
        number: i + 1,
        title: s.title || '',
        description: s.description || '',
      }));
  }

  private mapToFeatures(sections: LandingSectionEntry[]): Feature[] {
    return sections
      .filter(s => s.section === 'features' && s.isActive)
      .sort((a, b) => a.order - b.order)
      .map(s => ({
        icon: this.iconMap[s.icon || 'faClock'] || faClock,
        title: s.title || '',
        description: s.description || '',
      }));
  }

  private mapToTestimonials(sections: LandingSectionEntry[]): Testimonial[] {
    return sections
      .filter(s => s.section === 'testimonials' && s.isActive)
      .sort((a, b) => a.order - b.order)
      .map(s => ({
        quote: s.title || '',
        name: s.name || '',
        role: s.role || '',
        rating: s.rating || 5,
      }));
  }

  private mapToFaqs(sections: LandingSectionEntry[]): FaqItem[] {
    return sections
      .filter(s => s.section === 'faqs' && s.isActive)
      .sort((a, b) => a.order - b.order)
      .map(s => ({
        question: s.question || '',
        answer: s.answer || '',
      }));
  }

  scrollToFeatures(): void {
    document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
  }
}
