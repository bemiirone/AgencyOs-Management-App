export interface LandingSectionSeedEntry {
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

export function generateLandingSections(): LandingSectionSeedEntry[] {
  return [
    // Pain Points
    {
      section: 'painPoints',
      order: 0,
      isActive: true,
      icon: 'faEnvelope',
      title: 'Chasing Payments',
      description: 'Spending hours sending polite reminder emails instead of doing billable work?',
    },
    {
      section: 'painPoints',
      order: 1,
      isActive: true,
      icon: 'faFileInvoiceDollar',
      title: 'Looking Amateur',
      description: "Sending invoices from Word docs and hoping clients take you seriously?",
    },
    {
      section: 'painPoints',
      order: 2,
      isActive: true,
      icon: 'faClock',
      title: 'Losing Track of Time',
      description: 'Forgetting to log hours and leaving money on the table every month?',
    },

    // Value Props
    {
      section: 'valueProps',
      order: 0,
      isActive: true,
      icon: 'faFileInvoiceDollar',
      title: 'Professional Invoices in Seconds',
      description: 'Create beautiful, branded invoices with one click. Pull directly from your tracked time and send them straight to your client\'s inbox.',
    },
    {
      section: 'valueProps',
      order: 1,
      isActive: true,
      icon: 'faCreditCard',
      title: 'Get Paid Faster',
      description: 'Accept payments online via Stripe. Clients can pay by card in seconds, not weeks. Automated reminders chase late payments for you.',
    },
    {
      section: 'valueProps',
      order: 2,
      isActive: true,
      icon: 'faDoorOpen',
      title: 'A Client Portal That Makes You Look Established',
      description: "Give clients a secure login to view project progress, approve work, and pay invoices. It's the difference between looking like a solo freelancer and a proper business.",
    },
    {
      section: 'valueProps',
      order: 3,
      isActive: true,
      icon: 'faClock',
      title: 'Never Lose a Billable Hour Again',
      description: "Simple time tracking that actually fits your workflow. Start a timer, log time manually, or pull from completed tasks. See exactly what you've earned at a glance.",
    },

    // Steps
    {
      section: 'steps',
      order: 0,
      isActive: true,
      title: 'Sign up for free',
      description: 'No credit card needed. Get a full month to try everything.',
    },
    {
      section: 'steps',
      order: 1,
      isActive: true,
      title: 'Add your clients and projects',
      description: 'Import existing work or start fresh.',
    },
    {
      section: 'steps',
      order: 2,
      isActive: true,
      title: 'Track time and send invoices',
      description: 'Get paid professionally, every time.',
    },

    // Features
    {
      section: 'features',
      order: 0,
      isActive: true,
      icon: 'faClock',
      title: 'Time Tracking',
      description: 'Start, stop, and switch between projects with one click. Weekly timesheets show exactly where your hours went.',
    },
    {
      section: 'features',
      order: 1,
      isActive: true,
      icon: 'faFileInvoiceDollar',
      title: 'Invoicing',
      description: 'Turn tracked time into a polished invoice instantly. Add expenses, apply discounts, and set payment terms.',
    },
    {
      section: 'features',
      order: 2,
      isActive: true,
      icon: 'faDoorOpen',
      title: 'Client Portal',
      description: 'A branded space where clients see their projects, approve milestones, and pay invoices. No more back-and-forth emails.',
    },
    {
      section: 'features',
      order: 3,
      isActive: true,
      icon: 'faChartLine',
      title: 'Reports',
      description: 'See your monthly revenue, outstanding invoices, and billable hours at a glance. Know your numbers without the spreadsheet.',
    },

    // Testimonials
    {
      section: 'testimonials',
      order: 0,
      isActive: true,
      title: "I used to spend half a day each month on invoicing. Now it takes 10 minutes.",
      name: 'Sarah Chen',
      role: 'Freelance Designer',
      rating: 5,
    },
    {
      section: 'testimonials',
      order: 1,
      isActive: true,
      title: "The client portal made me look 10x more professional. Clients take me more seriously.",
      name: 'Marcus Rivera',
      role: 'Independent Developer',
      rating: 5,
    },
    {
      section: 'testimonials',
      order: 2,
      isActive: true,
      title: "At £5 a month, this pays for itself the first time I catch an unlogged billable hour.",
      name: 'Emma Walsh',
      role: 'Freelance Writer',
      rating: 5,
    },

    // FAQs
    {
      section: 'faqs',
      order: 0,
      isActive: true,
      question: 'Is there really a free month?',
      answer: 'Yes. Full access to everything for 30 days. No credit card required to start.',
    },
    {
      section: 'faqs',
      order: 1,
      isActive: true,
      question: 'What happens after the free month?',
      answer: "You'll be charged £5/month. You can cancel anytime before that with no obligation.",
    },
    {
      section: 'faqs',
      order: 2,
      isActive: true,
      question: 'Do I need Stripe to use it?',
      answer: "Stripe is optional. You can use AgencyOS for invoicing and time tracking alone, or connect Stripe to accept online payments.",
    },
    {
      section: 'faqs',
      order: 3,
      isActive: true,
      question: 'Can I export my data if I leave?',
      answer: 'Absolutely. Your data is yours. Export everything as CSV or PDF at any time.',
    },
    {
      section: 'faqs',
      order: 4,
      isActive: true,
      question: 'Is it suitable for part-time freelancers?',
      answer: 'Perfect for it. Whether you freelance 5 hours a week or 50, AgencyOS scales to fit.',
    },
  ];
}
