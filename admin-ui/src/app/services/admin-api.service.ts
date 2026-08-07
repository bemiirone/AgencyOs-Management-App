import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Tenant } from '../models/tenant.model';
import { Page, CreatePageRequest, UpdatePageRequest } from '../models/page.model';

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
}
