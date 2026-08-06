import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_CONFIG } from '../../core/config/api.config';
import { Page } from '../models/page.model';

@Injectable({
  providedIn: 'root',
})
export class PageService {
  private http = inject(HttpClient);

  getPages(): Observable<Page[]> {
    return this.http.get<Page[]>(`${API_CONFIG.baseUrl}${API_CONFIG.PAGES.LIST}`);
  }

  getPageBySlug(slug: string): Observable<Page> {
    return this.http.get<Page>(`${API_CONFIG.baseUrl}${API_CONFIG.PAGES.DETAIL(slug)}`);
  }
}
