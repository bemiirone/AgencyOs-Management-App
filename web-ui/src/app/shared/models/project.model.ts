export interface Project {
  _id: string;
  name: string;
  description?: string;
  status: 'draft' | 'active' | 'on_hold' | 'completed' | 'archived';
  tenantId: string;
  ownerId: string;
  teamMemberIds?: string[];
  clientId?: string;
  startDate?: Date;
  endDate?: Date;
  budget?: number;
  createdAt: Date;
  updatedAt: Date;
}
