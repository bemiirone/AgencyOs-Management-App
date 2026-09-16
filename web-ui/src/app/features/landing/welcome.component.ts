import { Component } from '@angular/core';
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

interface PainPoint {
  icon: any;
  title: string;
  description: string;
}

interface ValueProp {
  icon: any;
  title: string;
  description: string;
}

interface Step {
  number: number;
  title: string;
  description: string;
}

interface Feature {
  icon: any;
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
  imports: [CommonModule, RouterLink, FontAwesomeModule],
  templateUrl: './welcome.component.html',
  styleUrl: './welcome.component.scss',
})
export class WelcomeComponent {
  readonly faClock = faClock;
  readonly faPaperPlane = faPaperPlane;
  readonly faCreditCard = faCreditCard;
  readonly faUsers = faUsers;
  readonly faChartLine = faChartLine;
  readonly faEnvelope = faEnvelope;
  readonly faFileInvoiceDollar = faFileInvoiceDollar;
  readonly faDoorOpen = faDoorOpen;
  readonly faMagnifyingGlassChart = faMagnifyingGlassChart;
  readonly faStar = faStar;
  readonly faCheck = faCheck;
  readonly faCircleQuestion = faCircleQuestion;
  readonly faBolt = faBolt;
  readonly faShieldHalved = faShieldHalved;
  readonly faArrowDown = faArrowDown;

  readonly painPoints: PainPoint[] = [
    {
      icon: faEnvelope,
      title: 'Chasing Payments',
      description:
        'Spending hours sending polite reminder emails instead of doing billable work?',
    },
    {
      icon: faFileInvoiceDollar,
      title: 'Looking Amateur',
      description:
        "Sending invoices from Word docs and hoping clients take you seriously?",
    },
    {
      icon: faClock,
      title: 'Losing Track of Time',
      description:
        'Forgetting to log hours and leaving money on the table every month?',
    },
  ];

  readonly valueProps: ValueProp[] = [
    {
      icon: faFileInvoiceDollar,
      title: 'Professional Invoices in Seconds',
      description:
        'Create beautiful, branded invoices with one click. Pull directly from your tracked time and send them straight to your client\'s inbox.',
    },
    {
      icon: faCreditCard,
      title: 'Get Paid Faster',
      description:
        'Accept payments online via Stripe. Clients can pay by card in seconds, not weeks. Automated reminders chase late payments for you.',
    },
    {
      icon: faDoorOpen,
      title: 'A Client Portal That Makes You Look Established',
      description:
        "Give clients a secure login to view project progress, approve work, and pay invoices. It's the difference between looking like a solo freelancer and a proper business.",
    },
    {
      icon: faClock,
      title: 'Never Lose a Billable Hour Again',
      description:
        "Simple time tracking that actually fits your workflow. Start a timer, log time manually, or pull from completed tasks. See exactly what you've earned at a glance.",
    },
  ];

  readonly steps: Step[] = [
    {
      number: 1,
      title: 'Sign up for free',
      description: 'No credit card needed. Get a full month to try everything.',
    },
    {
      number: 2,
      title: 'Add your clients and projects',
      description: 'Import existing work or start fresh.',
    },
    {
      number: 3,
      title: 'Track time and send invoices',
      description: 'Get paid professionally, every time.',
    },
  ];

  readonly features: Feature[] = [
    {
      icon: faClock,
      title: 'Time Tracking',
      description:
        'Start, stop, and switch between projects with one click. Weekly timesheets show exactly where your hours went.',
    },
    {
      icon: faFileInvoiceDollar,
      title: 'Invoicing',
      description:
        'Turn tracked time into a polished invoice instantly. Add expenses, apply discounts, and set payment terms.',
    },
    {
      icon: faDoorOpen,
      title: 'Client Portal',
      description:
        'A branded space where clients see their projects, approve milestones, and pay invoices. No more back-and-forth emails.',
    },
    {
      icon: faChartLine,
      title: 'Reports',
      description:
        'See your monthly revenue, outstanding invoices, and billable hours at a glance. Know your numbers without the spreadsheet.',
    },
  ];

  readonly testimonials: Testimonial[] = [
    {
      quote:
        'I used to spend half a day each month on invoicing. Now it takes 10 minutes.',
      name: 'Sarah Chen',
      role: 'Freelance Designer',
      rating: 5,
    },
    {
      quote:
        'The client portal made me look 10x more professional. Clients take me more seriously.',
      name: 'Marcus Rivera',
      role: 'Independent Developer',
      rating: 5,
    },
    {
      quote:
        'At £5 a month, this pays for itself the first time I catch an unlogged billable hour.',
      name: 'Emma Walsh',
      role: 'Freelance Writer',
      rating: 5,
    },
  ];

  readonly faqs: FaqItem[] = [
    {
      question: 'Is there really a free month?',
      answer:
        'Yes. Full access to everything for 30 days. No credit card required to start.',
    },
    {
      question: 'What happens after the free month?',
      answer:
        "You'll be charged £5/month. You can cancel anytime before that with no obligation.",
    },
    {
      question: 'Do I need Stripe to use it?',
      answer:
        "Stripe is optional. You can use AgencyOS for invoicing and time tracking alone, or connect Stripe to accept online payments.",
    },
    {
      question: 'Can I export my data if I leave?',
      answer:
        'Absolutely. Your data is yours. Export everything as CSV or PDF at any time.',
    },
    {
      question: 'Is it suitable for part-time freelancers?',
      answer:
        'Perfect for it. Whether you freelance 5 hours a week or 50, AgencyOS scales to fit.',
    },
  ];

  scrollToFeatures(): void {
    document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
  }
}
