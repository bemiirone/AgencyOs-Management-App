export type ProjectStatus = 'draft' | 'active' | 'on_hold' | 'completed' | 'archived';

export interface CreateProjectPayload {
  name: string;
  description?: string;
  status?: ProjectStatus;
  clientId?: string;
  startDate?: Date;
  endDate?: Date;
  budget?: number;
}

export interface UpdateProjectPayload {
  name?: string;
  description?: string;
  status?: ProjectStatus;
  clientId?: string;
  startDate?: Date;
  endDate?: Date;
  budget?: number;
}
