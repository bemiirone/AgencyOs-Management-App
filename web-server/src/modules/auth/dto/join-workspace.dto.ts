import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class JoinWorkspaceDto {
  @ApiProperty({ example: 'AGENCY-2026' })
  @IsString()
  @IsNotEmpty()
  inviteCode: string;
}
