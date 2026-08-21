import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Tenant } from '../models/tenant.model';
import { Page, CreatePageRequest, UpdatePageRequest } from '../models/page.model';
import { Faq, CreateFaqRequest, UpdateFaqRequest } from '../models/faq.model';
import { NotificationSettings } from '../models/notification-settings.model';

export interface ContentEntry {
  _id: string;
  key: string;
  value: string;
  category: string;
  locale: string;
  description: string;
}

export interface ContentUpdateRequest {
  value: string;
}

export interface BulkContentRequest {
  entries: { key: string; value: string; category: string; locale?: string; description?: string }[];
}

@Injectable({ providedIn: 'root' })
export class AdminApiService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:3000/api/admin';

  getTenants(): Observable<Tenant[]> {
    return this.http.get<Tenant[]>(`${this.apiUrl}/tenants`);
  }

  toggleTenantStatus(id: string, isActive: boolean): Observable<Tenant> {
    return this.http.patch<Tenant>(`${this.apiUrl}/tenants/${id}/status`, { isActive });
  }

  deleteTenant(id: string): Observable<{ success: boolean }> {
    return this.http.delete<{ success: boolean }>(`${this.apiUrl}/tenants/${id}`);
  }

  getPages(): Observable<Page[]> {
    return this.http.get<Page[]>(`${this.apiUrl}/pages`);
  }

  createPage(data: CreatePageRequest): Observable<Page> {
    return this.http.post<Page>(`${this.apiUrl}/pages`, data);
  }

  updatePage(id: string, data: UpdatePageRequest): Observable<Page> {
    return this.http.patch<Page>(`${this.apiUrl}/pages/${id}`, data);
  }

  deletePage(id: string): Observable<{ success: boolean }> {
    return this.http.delete<{ success: boolean }>(`${this.apiUrl}/pages/${id}`);
  }

  getFaqs(): Observable<Faq[]> {
    return this.http.get<Faq[]>(`${this.apiUrl}/faqs`);
  }

  createFaq(data: CreateFaqRequest): Observable<Faq> {
    return this.http.post<Faq>(`${this.apiUrl}/faqs`, data);
  }

  updateFaq(id: string, data: UpdateFaqRequest): Observable<Faq> {
    return this.http.patch<Faq>(`${this.apiUrl}/faqs/${id}`, data);
  }

  deleteFaq(id: string): Observable<{ success: boolean }> {
    return this.http.delete<{ success: boolean }>(`${this.apiUrl}/faqs/${id}`);
  }

  getNotificationSettings(): Observable<NotificationSettings> {
    return this.http.get<NotificationSettings>(`${this.apiUrl}/notification-settings`);
  }

  updateNotificationSettings(data: Partial<NotificationSettings>): Observable<NotificationSettings> {
    return this.http.put<NotificationSettings>(`${this.apiUrl}/notification-settings`, data);
  }

  getContent(): Observable<ContentEntry[]> {
    return this.http.get<ContentEntry[]>(`${this.apiUrl}/content`);
  }

  updateContent(key: string, data: ContentUpdateRequest): Observable<ContentEntry> {
    return this.http.patch<ContentEntry>(`${this.apiUrl}/content/${key}`, data);
  }

  bulkUpdateContent(entries: BulkContentRequest['entries']): Observable<ContentEntry[]> {
    return this.http.post<ContentEntry[]>(`${this.apiUrl}/content/bulk`, { entries });
  }

  createContent(data: ContentEntry): Observable<ContentEntry> {
    return this.http.post<ContentEntry>(`${this.apiUrl}/content`, data);
  }
}
