import { NestFactory } from '@nestjs/core';
import { getModelToken } from '@nestjs/mongoose';
import { AppModule } from '../app/app.module';
import { User } from '../modules/auth/schemas/user.schema';
import { TenantMember } from '../modules/tenant/schemas/tenant-member.schema';
import { UserRole } from '../modules/auth/enums/user-role.enum';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);

  const userModel = app.get(getModelToken(User.name));
  const tenantMemberModel = app.get(getModelToken(TenantMember.name));

  console.log('Starting migration: Creating TenantMember records from existing Users...');

  const users = await userModel.find({}).lean();

  console.log(`Found ${users.length} total users`);

  let created = 0;
  let skipped = 0;
  let noTenant = 0;

  for (const user of users as any[]) {
    const tenantId = user.tenantId;

    if (!tenantId) {
      console.log(`Skipping user ${user.email} - no tenantId found`);
      noTenant++;
      continue;
    }

    const existing = await tenantMemberModel.findOne({
      userId: user._id,
      tenantId,
    });

    if (existing) {
      console.log(`Skipping user ${user.email} - already has TenantMember record`);
      skipped++;
      continue;
    }

    await tenantMemberModel.create({
      userId: user._id,
      tenantId,
      role: user.role || UserRole.MEMBER,
      isActive: true,
    });

    console.log(`Created TenantMember for user ${user.email} with role: ${user.role || UserRole.MEMBER}`);
    created++;
  }

  console.log(`\nMigration complete!`);
  console.log(`Created: ${created}`);
  console.log(`Skipped (already migrated): ${skipped}`);
  console.log(`Skipped (no tenantId): ${noTenant}`);

  await app.close();
}

bootstrap().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
