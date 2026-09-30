import { Injectable, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { ContentStore } from '../../../stores/content.store';

@Injectable({ providedIn: 'root' })
export class InvoiceSubmissionService {
  private readonly router = inject(Router);
  private readonly contentStore = inject(ContentStore);

  readonly saving = signal(false);
  readonly error = signal('');

  handleSubmission(
    execute: () => Observable<unknown>,
    errorKey: string
  ): void {
    this.saving.set(true);
    this.error.set('');

    execute().subscribe({
      next: () => {
        this.saving.set(false);
        this.router.navigate(['/invoices']);
      },
      error: (err: unknown) => {
        const error = err as { error?: { message?: string } };
        this.error.set(error.error?.message || this.contentStore.content(errorKey));
        this.saving.set(false);
      },
    });
  }
}
