import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { AdminUser } from './schemas/admin-user.schema';
import { AdminLoginDto } from './dto/admin-login.dto';
import { AdminJwtPayload } from './interfaces/admin-jwt-payload.interface';

@Injectable()
export class AdminAuthService {
  constructor(
    @InjectModel(AdminUser.name) private adminUserModel: Model<AdminUser>,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async login(loginDto: AdminLoginDto) {
    const admin = await this.adminUserModel.findOne({ email: loginDto.email });

    if (!admin) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (admin.isActive === false) {
      throw new UnauthorizedException('Account is deactivated');
    }

    const isPasswordValid = await bcrypt.compare(loginDto.password, admin.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload: AdminJwtPayload = {
      sub: admin._id.toString(),
      email: admin.email,
      role: admin.role,
    };

    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('adminJwt.secret') || 'admin-secret',
      expiresIn: this.configService.get<string>('adminJwt.expiration') || '12h',
    });

    return {
      admin: {
        id: admin._id.toString(),
        email: admin.email,
        role: admin.role,
      },
      accessToken,
    };
  }
}
