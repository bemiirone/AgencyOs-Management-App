export interface FaqItem {
  question: string;
  answer: string;
  order: number;
}

export interface Faq {
  _id: string;
  title: string;
  items: FaqItem[];
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateFaqRequest {
  title: string;
  items: FaqItem[];
  order: number;
}

export interface UpdateFaqRequest {
  title?: string;
  items?: FaqItem[];
  order?: number;
}
