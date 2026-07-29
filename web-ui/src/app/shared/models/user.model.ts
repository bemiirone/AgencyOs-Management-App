export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'manager' | 'member' | 'client';
  avatar?: string;
  createdAt: Date;
  updatedAt: Date;
}
