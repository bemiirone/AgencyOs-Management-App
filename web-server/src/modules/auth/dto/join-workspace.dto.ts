import { IsNotEmpty, IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class JoinWorkspaceDto {
  @ApiProperty({ example: 'AGENCY-2026' })
  @IsString()
  @IsNotEmpty()
  inviteCode: string;

  @ApiProperty({ example: '6a69c115ed209b396d5182e2' })
  @IsString()
  @IsNotEmpty()
  tenantId: string;
}
