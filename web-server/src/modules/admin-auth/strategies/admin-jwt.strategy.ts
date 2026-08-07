import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AdminJwtPayload } from '../interfaces/admin-jwt-payload.interface';

@Injectable()
export class AdminJwtStrategy extends PassportStrategy(Strategy, 'admin-jwt') {
  constructor(configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('adminJwt.secret') || 'admin-secret',
    });
  }

  async validate(payload: AdminJwtPayload) {
    if (!payload.sub) {
      throw new UnauthorizedException('Invalid token payload');
    }

    return {
      adminId: payload.sub,
      email: payload.email,
      role: payload.role,
    };
  }
}
