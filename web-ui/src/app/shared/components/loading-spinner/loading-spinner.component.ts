import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faSpinner } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-loading-spinner',
  standalone: true,
  imports: [CommonModule, FontAwesomeModule],
  templateUrl: './loading-spinner.component.html',
})
export class LoadingSpinnerComponent {
  faSpinner = faSpinner;
}
