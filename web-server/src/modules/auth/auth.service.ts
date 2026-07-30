import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { User } from './schemas/user.schema';
import { Tenant } from '../tenant/schemas/tenant.schema';
import { TenantMember } from '../tenant/schemas/tenant-member.schema';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { UserRole } from './enums/user-role.enum';
import { JwtPayload } from './interfaces/jwt-payload.interface';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(Tenant.name) private tenantModel: Model<Tenant>,
    @InjectModel(TenantMember.name) private tenantMemberModel: Model<TenantMember>,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async register(registerDto: RegisterDto) {
    const existingUser = await this.userModel.findOne({ email: registerDto.email });

    if (existingUser) {
      throw new ConflictException('Email already registered');
    }

    const hashedPassword = await bcrypt.hash(registerDto.password, 12);

    const user = await this.userModel.create({
      ...registerDto,
      password: hashedPassword,
      isActive: true,
    });

    const tenant = await this.tenantModel.create({
      name: registerDto.agencyName,
      slug: registerDto.agencyName.toLowerCase().replace(/\s+/g, '-'),
      ownerId: user._id,
    });

    await this.tenantMemberModel.create({
      userId: user._id,
      tenantId: tenant._id,
      role: UserRole.ADMIN,
      isActive: true,
    });

    const tokens = this.generateTokens(user._id.toString(), user.email, tenant._id.toString(), UserRole.ADMIN);
    const tenantDoc = await this.tenantModel.findOne({ _id: tenant._id });

    return {
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: UserRole.ADMIN,
        tenantId: tenant._id.toString(),
        tenantName: tenantDoc?.name || '',
      },
      ...tokens,
    };
  }

  async login(loginDto: LoginDto) {
    const user = await this.userModel.findOne({ email: loginDto.email });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account is deactivated');
    }

    const isPasswordValid = await bcrypt.compare(loginDto.password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const membership = await this.tenantMemberModel.findOne({
      userId: user._id,
      isActive: true,
    }).populate('tenantId');

    if (!membership) {
      throw new UnauthorizedException('No active workspace found');
    }

    const tenantDoc = membership.tenantId as any;
    const tenantId = tenantDoc._id.toString();
    const tenantName = tenantDoc.name || '';
    const role = membership.role;

    const tokens = this.generateTokens(user._id.toString(), user.email, tenantId, role);

    return {
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role,
        tenantId,
        tenantName,
      },
      ...tokens,
    };
  }

  private generateTokens(userId: string, email: string, tenantId: string, role: UserRole) {
    const payload: JwtPayload = {
      sub: userId,
      email,
      tenantId,
      role,
    };

    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('jwt.secret'),
      expiresIn: this.configService.get<string>('jwt.expiration'),
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('jwt.secret'),
      expiresIn: this.configService.get<string>('jwt.refreshExpiration'),
    });

    return { accessToken, refreshToken };
  }
}
