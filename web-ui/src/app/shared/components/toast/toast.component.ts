import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faCheckCircle, faExclamationCircle, faInfoCircle, faExclamationTriangle, faTimes } from '@fortawesome/free-solid-svg-icons';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule, FontAwesomeModule],
  template: `
    <div class="fixed top-4 right-4 z-50 flex flex-col gap-2 w-80">
      @for (toast of toastService.toasts(); track toast.id) {
        <div
          class="alert shadow-lg flex items-start gap-3 animate-slide-in"
          [class.alert-success]="toast.type === 'success'"
          [class.alert-error]="toast.type === 'error'"
          [class.alert-info]="toast.type === 'info'"
          [class.alert-warning]="toast.type === 'warning'"
        >
          <fa-icon
            [icon]="getIcon(toast.type)"
            class="text-lg mt-0.5"
          ></fa-icon>
          <span class="text-sm flex-1">{{ toast.message }}</span>
          <button class="btn btn-ghost btn-xs" (click)="toastService.remove(toast.id)">
            <fa-icon [icon]="faTimes"></fa-icon>
          </button>
        </div>
      }
    </div>
  `,
})
export class ToastComponent {
  toastService = inject(ToastService);

  faCheckCircle = faCheckCircle;
  faExclamationCircle = faExclamationCircle;
  faInfoCircle = faInfoCircle;
  faExclamationTriangle = faExclamationTriangle;
  faTimes = faTimes;

  getIcon(type: string): any {
    switch (type) {
      case 'success': return this.faCheckCircle;
      case 'error': return this.faExclamationCircle;
      case 'info': return this.faInfoCircle;
      case 'warning': return this.faExclamationTriangle;
      default: return this.faInfoCircle;
    }
  }
}
