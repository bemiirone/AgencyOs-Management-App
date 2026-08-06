export interface Page {
  _id: string;
  slug: string;
  title: string;
  content: string;
  isPublished: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
}
