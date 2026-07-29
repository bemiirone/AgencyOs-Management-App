export interface Project {
  _id: string;
  name: string;
  description?: string;
  status: 'draft' | 'active' | 'on hold' | 'completed' | 'archived';
  tenantId: string;
  ownerId: string;
  teamMemberIds?: string[];
  clientId?: string;
  startDate?: string | Date;
  endDate?: string | Date;
  budget?: number;
  createdAt: string | Date;
  updatedAt: string | Date;
}
