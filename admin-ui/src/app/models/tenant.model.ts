export interface Tenant {
  _id: string;
  name: string;
  slug: string;
  ownerId: string;
  memberIds: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
