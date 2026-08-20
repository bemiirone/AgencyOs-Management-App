import { Injectable, signal, computed, inject } from '@angular/core';
import { catchError, tap, throwError } from 'rxjs';
import { ContentService, ContentEntry } from '../shared/services/content.service';

@Injectable({ providedIn: 'root' })
export class ContentStore {
  private contentService = inject(ContentService);

  private _entries = signal<Map<string, string>>(new Map());
  private _isLoaded = signal(false);
  private _isLoading = signal(false);

  entries = computed(() => this._entries());
  isLoaded = computed(() => this._isLoaded());
  isLoading = computed(() => this._isLoading());

  content(key: string): string {
    return this._entries().get(key) ?? key;
  }

  contentWithParams(key: string, params: Record<string, string | number> = {}): string {
    let value = this._entries().get(key) ?? key;
    for (const [paramKey, paramValue] of Object.entries(params)) {
      value = value.replace(new RegExp(`{{${paramKey}}}`, 'g'), String(paramValue));
    }
    return value;
  }

  loadAll() {
    this._isLoading.set(true);

    return this.contentService.loadAll().pipe(
      tap((entries) => {
        const map = new Map<string, string>();
        for (const entry of entries) {
          map.set(entry.key, entry.value);
        }
        this._entries.set(map);
        this._isLoaded.set(true);
        this._isLoading.set(false);
      }),
      catchError((error) => {
        this._isLoading.set(false);
        return throwError(() => error);
      }),
    );
  }
}
