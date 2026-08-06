import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { API_CONFIG } from '../../core/config/api.config';

export interface FaqItem {
  question: string;
  answer: string;
  order: number;
}

export interface FaqHeading {
  _id: string;
  title: string;
  items: FaqItem[];
  order: number;
}

@Injectable({
  providedIn: 'root',
})
export class FaqService {
  private http = inject(HttpClient);

  async getFaqs(): Promise<FaqHeading[]> {
    return firstValueFrom(
      this.http.get<FaqHeading[]>(`${API_CONFIG.baseUrl}/api/faq`)
    );
  }
}
