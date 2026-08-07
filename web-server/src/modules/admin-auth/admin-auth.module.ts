import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule, JwtModuleOptions } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AdminAuthService } from './admin-auth.service';
import { AdminAuthController } from './admin-auth.controller';
import { AdminJwtStrategy } from './strategies/admin-jwt.strategy';
import { AdminUser, AdminUserSchema } from './schemas/admin-user.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: AdminUser.name, schema: AdminUserSchema },
    ]),
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService): JwtModuleOptions => ({
        secret: configService.get<string>('adminJwt.secret') || 'admin-secret',
        signOptions: {
          expiresIn: (configService.get<string>('adminJwt.expiration') || '12h') as any,
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AdminAuthController],
  providers: [AdminAuthService, AdminJwtStrategy],
  exports: [AdminAuthService],
})
export class AdminAuthModule {}
