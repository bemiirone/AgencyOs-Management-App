import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app/app.module';
import { AdminAuthService } from '../modules/admin-auth/admin-auth.service';
import * as bcrypt from 'bcrypt';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const adminAuthService = app.get(AdminAuthService);

  const adminEmail = process.env.ADMIN_EMAIL || 'admin@agencyos.com';
  const adminPassword = process.env.ADMIN_PASSWORD || 'Admin123!';

  const existingAdmin = await (adminAuthService as any).adminUserModel.findOne({ email: adminEmail });

  if (existingAdmin) {
    console.log('Admin user already exists:', adminEmail);
    await app.close();
    return;
  }

  const hashedPassword = await bcrypt.hash(adminPassword, 12);

  await (adminAuthService as any).adminUserModel.create({
    email: adminEmail,
    password: hashedPassword,
    role: 'admin',
    isActive: true,
  });

  console.log('Admin user created successfully:', adminEmail);
  console.log('Email:', adminEmail);
  console.log('Password:', adminPassword);
  console.log('Please change the password in production!');

  await app.close();
}

bootstrap().catch((err) => {
  console.error('Error creating admin user:', err);
  process.exit(1);
});
