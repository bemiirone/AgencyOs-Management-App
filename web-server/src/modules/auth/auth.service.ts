import { Injectable, UnauthorizedException, ConflictException, BadRequestException } from '@nestjs/common';
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
import { SwitchWorkspaceDto } from './dto/switch-workspace.dto';
import { JoinWorkspaceDto } from './dto/join-workspace.dto';
import { UserRole } from './enums/user-role.enum';
import { JwtPayload } from './interfaces/jwt-payload.interface';

export interface WorkspaceInfo {
  tenantId: string;
  tenantName: string;
  role: UserRole;
  isLastUsed: boolean;
}

export interface LoginResponse {
  user: {
    id: string;
    email: string;
    name: string;
    role: UserRole;
    tenantId: string;
    tenantName: string;
  };
  accessToken: string;
  refreshToken: string;
  requiresWorkspaceSelection?: boolean;
  workspaces?: WorkspaceInfo[];
}

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

  async login(loginDto: LoginDto): Promise<LoginResponse> {
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

    const memberships = await this.tenantMemberModel.find({
      userId: user._id,
      isActive: true,
    }).populate('tenantId');

    if (memberships.length === 0) {
      throw new UnauthorizedException('No active workspace found');
    }

    if (memberships.length === 1) {
      const membership = memberships[0];
      const tenantDoc = membership.tenantId as any;
      const tenantId = tenantDoc._id.toString();
      const tenantName = tenantDoc.name || '';
      const role = membership.role;

      const tokens = this.generateTokens(user._id.toString(), user.email, tenantId, role);

      return {
        user: {
          id: user._id.toString(),
          email: user.email,
          name: user.name,
          role,
          tenantId,
          tenantName,
        },
        ...tokens,
      };
    }

    const workspaces: WorkspaceInfo[] = memberships.map((m) => {
      const tenantDoc = m.tenantId as any;
      return {
        tenantId: tenantDoc._id.toString(),
        tenantName: tenantDoc.name || '',
        role: m.role,
        isLastUsed: false,
      };
    });

    const roleHierarchy = [UserRole.ADMIN, UserRole.MANAGER, UserRole.MEMBER, UserRole.CLIENT];
    const highestRole = memberships.reduce((highest, m) => {
      return roleHierarchy.indexOf(m.role) < roleHierarchy.indexOf(highest) ? m.role : highest;
    }, memberships[0].role);

    const primaryMembership = memberships.find((m) => m.role === highestRole)!;
    const primaryTenant = primaryMembership.tenantId as any;

    return {
      user: {
        id: user._id.toString(),
        email: user.email,
        name: user.name,
        role: highestRole,
        tenantId: primaryTenant._id.toString(),
        tenantName: primaryTenant.name || '',
      },
      ...this.generateTokens(user._id.toString(), user.email, primaryTenant._id.toString(), highestRole),
      requiresWorkspaceSelection: true,
      workspaces,
    };
  }

  async getWorkspaces(userId: string): Promise<WorkspaceInfo[]> {
    const memberships = await this.tenantMemberModel.find({
      userId,
      isActive: true,
    }).populate('tenantId');

    return memberships.map((m) => {
      const tenantDoc = m.tenantId as any;
      return {
        tenantId: tenantDoc._id.toString(),
        tenantName: tenantDoc.name || '',
        role: m.role,
        isLastUsed: false,
      };
    });
  }

  async switchWorkspace(userId: string, dto: SwitchWorkspaceDto): Promise<LoginResponse> {
    const membership = await this.tenantMemberModel.findOne({
      userId,
      tenantId: dto.tenantId,
      isActive: true,
    }).populate('tenantId');

    if (!membership) {
      throw new UnauthorizedException('No access to this workspace');
    }

    const user = await this.userModel.findById(userId);
    const tenantDoc = membership.tenantId as any;
    const tenantId = tenantDoc._id.toString();
    const tenantName = tenantDoc.name || '';
    const role = membership.role;

    const tokens = this.generateTokens(userId, user!.email, tenantId, role);

    return {
      user: {
        id: userId,
        email: user!.email,
        name: user!.name,
        role,
        tenantId,
        tenantName,
      },
      ...tokens,
    };
  }

  async joinWorkspace(userId: string, dto: JoinWorkspaceDto): Promise<WorkspaceInfo[]> {
    const inviteCode = this.configService.get<string>('INVITE_CODE');

    if (!inviteCode || dto.inviteCode !== inviteCode) {
      throw new BadRequestException('Invalid invite code');
    }

    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const memberships = await this.tenantMemberModel.find({ userId, isActive: true });
    if (memberships.length === 0) {
      throw new BadRequestException('No active workspace found. Please contact support.');
    }

    return this.getWorkspaces(userId);
  }

  async searchWorkspaces(query: string) {
    if (!query || query.trim().length < 2) {
      return [];
    }

    const tenants = await this.tenantModel.find({
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { slug: { $regex: query, $options: 'i' } },
      ],
    }).limit(10);

    return tenants.map((t) => ({
      tenantId: t._id.toString(),
      tenantName: t.name,
      slug: t.slug,
    }));
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
