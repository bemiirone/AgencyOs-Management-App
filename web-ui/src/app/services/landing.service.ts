import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_CONFIG } from '../core/config/api.config';

export interface LandingSectionEntry {
  _id: string;
  section: string;
  order: number;
  isActive: boolean;
  icon?: string;
  title?: string;
  description?: string;
  name?: string;
  role?: string;
  rating?: number;
  question?: string;
  answer?: string;
}

@Injectable({ providedIn: 'root' })
export class LandingService {
  private http = inject(HttpClient);

  getAll(): Observable<LandingSectionEntry[]> {
    return this.http.get<LandingSectionEntry[]>(API_CONFIG.LANDING.LIST);
  }

  getBySection(section: string): Observable<LandingSectionEntry[]> {
    return this.http.get<LandingSectionEntry[]>(API_CONFIG.LANDING.BY_SECTION(section));
  }
}
