export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'manager' | 'member' | 'client';
  tenantId: string;
  tenantName: string;
  avatar?: string;
  createdAt: Date;
  updatedAt: Date;
}
