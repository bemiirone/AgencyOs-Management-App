import { Component, input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgApexchartsModule } from 'ng-apexcharts';
import type { ApexOptions } from 'apexcharts';

@Component({
  selector: 'app-chart-card',
  standalone: true,
  imports: [CommonModule, NgApexchartsModule],
  templateUrl: './chart-card.component.html',
})
export class ChartCardComponent {
  readonly title = input.required<string>();
  readonly chartOptions = input.required<ApexOptions>();
  readonly loading = input<boolean>(false);
}
