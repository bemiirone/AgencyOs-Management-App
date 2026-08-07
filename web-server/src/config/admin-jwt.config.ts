import { registerAs } from '@nestjs/config';

export default registerAs('adminJwt', () => ({
  secret: process.env.ADMIN_JWT_SECRET || 'admin-secret-change-in-production',
  expiration: process.env.ADMIN_JWT_EXPIRATION || '12h',
}));
