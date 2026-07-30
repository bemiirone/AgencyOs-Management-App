import { Controller, Post, Body, HttpCode, HttpStatus, UseGuards, Get, Req, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { SwitchWorkspaceDto } from './dto/switch-workspace.dto';
import { JoinWorkspaceDto } from './dto/join-workspace.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

interface RequestWithUser extends Request {
  user: { userId: string };
}

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Register a new user and create tenant' })
  @ApiResponse({ status: 201, description: 'User registered successfully' })
  @ApiResponse({ status: 409, description: 'Email already registered' })
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login with email and password' })
  @ApiResponse({ status: 200, description: 'Login successful' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('workspaces')
  @ApiOperation({ summary: 'Get all workspaces for the current user' })
  async getWorkspaces(@Req() req: RequestWithUser) {
    return this.authService.getWorkspaces(req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('switch-workspace')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Switch to a different workspace' })
  async switchWorkspace(@Req() req: RequestWithUser, @Body() dto: SwitchWorkspaceDto) {
    return this.authService.switchWorkspace(req.user.userId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Post('join-workspace')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Join a workspace using an invite code' })
  async joinWorkspace(@Req() req: RequestWithUser, @Body() dto: JoinWorkspaceDto) {
    return this.authService.joinWorkspace(req.user.userId, dto);
  }

  @Get('search-workspaces')
  @ApiOperation({ summary: 'Search workspaces by name or slug' })
  async searchWorkspaces(@Query('q') q: string) {
    return this.authService.searchWorkspaces(q);
  }
}
