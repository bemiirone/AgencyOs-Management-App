export interface LandingSection {
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
  createdAt: string;
  updatedAt: string;
}

export type SectionType = 'painPoints' | 'valueProps' | 'steps' | 'features' | 'testimonials' | 'faqs';

export interface CreateLandingSectionRequest {
  section: SectionType;
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

export interface UpdateLandingSectionRequest {
  section?: SectionType;
  order?: number;
  isActive?: boolean;
  icon?: string;
  title?: string;
  description?: string;
  name?: string;
  role?: string;
  rating?: number;
  question?: string;
  answer?: string;
}

export interface LandingSectionDialogData {
  mode: 'create' | 'edit';
  sectionType: SectionType;
  item?: LandingSection;
}
