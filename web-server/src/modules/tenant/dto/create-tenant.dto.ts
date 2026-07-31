import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateTenantDto {
  @ApiProperty({ example: 'My Agency' })
  @IsString()
  @IsNotEmpty()
  declare name: string;

  @ApiProperty({ example: 'my-agency' })
  @IsString()
  @IsNotEmpty()
  declare slug: string;
}
