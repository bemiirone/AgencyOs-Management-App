import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class JoinWorkspaceDto {
  @ApiProperty({ example: 'AGENCY-2026' })
  @IsString()
  @IsNotEmpty()
  declare inviteCode: string;

  @ApiProperty({ example: '6a69c115ed209b396d5182e2' })
  @IsString()
  @IsNotEmpty()
  declare tenantId: string;
}
