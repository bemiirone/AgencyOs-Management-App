import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_CONFIG } from '../../core/config/api.config';

export interface ContentEntry {
  _id: string;
  key: string;
  value: string;
  category: string;
  locale: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

@Injectable({
  providedIn: 'root',
})
export class ContentService {
  private http = inject(HttpClient);

  loadAll(locale?: string): Observable<ContentEntry[]> {
    return this.http.get<ContentEntry[]>(API_CONFIG.CONTENT.LIST(locale));
  }

  getByCategory(category: string, locale?: string): Observable<ContentEntry[]> {
    return this.http.get<ContentEntry[]>(API_CONFIG.CONTENT.BY_CATEGORY(category, locale));
  }
}
