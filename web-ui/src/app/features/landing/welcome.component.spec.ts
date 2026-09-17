import { describe, it, expect, beforeEach, vi } from 'vitest';
import { IconDefinition, faClock, faEnvelope, faFileInvoiceDollar } from '@fortawesome/free-solid-svg-icons';

interface LandingSectionEntry {
  _id: string;
  section: string;
  order: number;
  isActive: boolean;
  icon?: string;
  title?: string;
  description?: string;
  name?: string;
  role?: string;
  rating?: number;
  question?: string;
  answer?: string;
}

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

function createMappingFunctions() {
  const iconMap: Record<string, IconDefinition> = {
    faClock,
    faEnvelope,
    faFileInvoiceDollar,
  };

  return {
    mapToPainPoints(sections: LandingSectionEntry[]): PainPoint[] {
      return sections
        .filter(s => s.section === 'painPoints' && s.isActive)
        .sort((a, b) => a.order - b.order)
        .map(s => ({
          icon: iconMap[s.icon || 'faEnvelope'] || faEnvelope,
          title: s.title || '',
          description: s.description || '',
        }));
    },
    mapToValueProps(sections: LandingSectionEntry[]): ValueProp[] {
      return sections
        .filter(s => s.section === 'valueProps' && s.isActive)
        .sort((a, b) => a.order - b.order)
        .map(s => ({
          icon: iconMap[s.icon || 'faFileInvoiceDollar'] || faFileInvoiceDollar,
          title: s.title || '',
          description: s.description || '',
        }));
    },
    mapToSteps(sections: LandingSectionEntry[]): Step[] {
      return sections
        .filter(s => s.section === 'steps' && s.isActive)
        .sort((a, b) => a.order - b.order)
        .map((s, i) => ({
          number: i + 1,
          title: s.title || '',
          description: s.description || '',
        }));
    },
    mapToFeatures(sections: LandingSectionEntry[]): Feature[] {
      return sections
        .filter(s => s.section === 'features' && s.isActive)
        .sort((a, b) => a.order - b.order)
        .map(s => ({
          icon: iconMap[s.icon || 'faClock'] || faClock,
          title: s.title || '',
          description: s.description || '',
        }));
    },
    mapToTestimonials(sections: LandingSectionEntry[]): Testimonial[] {
      return sections
        .filter(s => s.section === 'testimonials' && s.isActive)
        .sort((a, b) => a.order - b.order)
        .map(s => ({
          quote: s.title || '',
          name: s.name || '',
          role: s.role || '',
          rating: s.rating || 5,
        }));
    },
    mapToFaqs(sections: LandingSectionEntry[]): FaqItem[] {
      return sections
        .filter(s => s.section === 'faqs' && s.isActive)
        .sort((a, b) => a.order - b.order)
        .map(s => ({
          question: s.question || '',
          answer: s.answer || '',
        }));
    },
  };
}

const mockSections: LandingSectionEntry[] = [
  { _id: '1', section: 'painPoints', order: 1, isActive: true, icon: 'faClock', title: 'Time Wasted', description: 'Losing hours' },
  { _id: '2', section: 'painPoints', order: 0, isActive: true, icon: 'faEnvelope', title: 'Chasing Payments', description: 'Email reminders' },
  { _id: '3', section: 'painPoints', order: 2, isActive: false, icon: 'faClock', title: 'Inactive', description: 'Should not appear' },
  { _id: '4', section: 'valueProps', order: 0, isActive: true, icon: 'faFileInvoiceDollar', title: 'Invoice Fast', description: 'Quick invoicing' },
  { _id: '5', section: 'features', order: 0, isActive: true, icon: 'faClock', title: 'Time Tracking', description: 'Track time easily' },
  { _id: '6', section: 'testimonials', order: 0, isActive: true, title: 'Great tool', name: 'John', role: 'Dev', rating: 5 },
  { _id: '7', section: 'faqs', order: 0, isActive: true, question: 'Is it free?', answer: 'Yes' },
  { _id: '8', section: 'steps', order: 0, isActive: true, title: 'Sign up', description: 'Register first' },
];

describe('WelcomeComponent Mapping Functions', () => {
  let mapper: ReturnType<typeof createMappingFunctions>;

  beforeEach(() => {
    mapper = createMappingFunctions();
  });

  describe('mapToPainPoints', () => {
    it('filters only painPoints section with isActive=true', () => {
      const result = mapper.mapToPainPoints(mockSections);
      expect(result).toHaveLength(2);
      expect(result.map(p => p.title)).toContain('Chasing Payments');
      expect(result.map(p => p.title)).not.toContain('Inactive');
    });

    it('sorts by order ascending', () => {
      const result = mapper.mapToPainPoints(mockSections);
      expect(result[0].title).toBe('Chasing Payments');
      expect(result[1].title).toBe('Time Wasted');
    });

    it('resolves icon from iconMap, falls back to faEnvelope', () => {
      const result = mapper.mapToPainPoints(mockSections);
      expect(result[0].icon).toBe(faEnvelope);
      expect(result[1].icon).toBe(faClock);
    });

    it('returns empty array when no painPoints exist', () => {
      const result = mapper.mapToPainPoints([]);
      expect(result).toEqual([]);
    });
  });

  describe('mapToValueProps', () => {
    it('filters only valueProps section', () => {
      const result = mapper.mapToValueProps(mockSections);
      expect(result).toHaveLength(1);
      expect(result[0].title).toBe('Invoice Fast');
    });

    it('resolves icon from iconMap, falls back to faFileInvoiceDollar', () => {
      const result = mapper.mapToValueProps(mockSections);
      expect(result[0].icon).toBe(faFileInvoiceDollar);
    });
  });

  describe('mapToSteps', () => {
    it('filters only steps section and assigns sequential numbers', () => {
      const sections = [
        { _id: '1', section: 'steps', order: 2, isActive: true, title: 'Third', description: 'Last' },
        { _id: '2', section: 'steps', order: 0, isActive: true, title: 'First', description: 'Start' },
        { _id: '3', section: 'steps', order: 1, isActive: true, title: 'Second', description: 'Middle' },
      ];
      const result = mapper.mapToSteps(sections);
      expect(result).toHaveLength(3);
      expect(result[0].number).toBe(1);
      expect(result[0].title).toBe('First');
      expect(result[1].number).toBe(2);
      expect(result[2].number).toBe(3);
    });
  });

  describe('mapToFeatures', () => {
    it('filters only features section', () => {
      const result = mapper.mapToFeatures(mockSections);
      expect(result).toHaveLength(1);
      expect(result[0].title).toBe('Time Tracking');
    });

    it('resolves icon from iconMap, falls back to faClock', () => {
      const result = mapper.mapToFeatures(mockSections);
      expect(result[0].icon).toBe(faClock);
    });
  });

  describe('mapToTestimonials', () => {
    it('maps title to quote and includes name/role/rating', () => {
      const result = mapper.mapToTestimonials(mockSections);
      expect(result).toHaveLength(1);
      expect(result[0].quote).toBe('Great tool');
      expect(result[0].name).toBe('John');
      expect(result[0].role).toBe('Dev');
      expect(result[0].rating).toBe(5);
    });

    it('defaults rating to 5 when not provided', () => {
      const sections = [{ _id: '1', section: 'testimonials', order: 0, isActive: true, title: 'Good' }];
      const result = mapper.mapToTestimonials(sections);
      expect(result[0].rating).toBe(5);
    });
  });

  describe('mapToFaqs', () => {
    it('maps question and answer fields', () => {
      const result = mapper.mapToFaqs(mockSections);
      expect(result).toHaveLength(1);
      expect(result[0].question).toBe('Is it free?');
      expect(result[0].answer).toBe('Yes');
    });

    it('returns empty array when no FAQs exist', () => {
      const result = mapper.mapToFaqs([]);
      expect(result).toEqual([]);
    });
  });
});
