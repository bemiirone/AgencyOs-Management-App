import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SwitchWorkspaceDto {
  @ApiProperty({ example: '507f191e810c19729de860ea' })
  @IsString()
  @IsNotEmpty()
  tenantId: string;
}
