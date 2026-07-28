import { UserRole } from '../enums/user-role.enum';

export interface JwtPayload {
  sub: string;
  email: string;
  tenantId: string;
  role: UserRole;
}
