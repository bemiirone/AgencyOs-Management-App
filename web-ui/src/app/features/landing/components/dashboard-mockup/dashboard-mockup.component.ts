import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { ContentStore } from '../../../../stores/content.store';

interface MockStats {
  value: string;
  labelKey: string;
}

@Component({
  selector: 'app-dashboard-mockup',
  standalone: true,
  imports: [CommonModule, FontAwesomeModule],
  templateUrl: './dashboard-mockup.component.html',
  styleUrl: './dashboard-mockup.component.scss',
})
export class DashboardMockupComponent {
  readonly contentStore = inject(ContentStore);

  readonly mockData = {
    brand: 'landing.hero.mockup.brand',
    invoiceNumber: '#1042',
    invoiceStatus: 'Sent',
    client: 'Acme Corp',
    amount: '£2,450.00',
    progressPercent: '75',
  };

  readonly stats: MockStats[] = [
    { value: '£8,320', labelKey: 'landing.mockup.stat.revenue' },
    { value: '42h', labelKey: 'landing.mockup.stat.tracked' },
    { value: '3', labelKey: 'landing.mockup.stat.pending' },
  ];
}
