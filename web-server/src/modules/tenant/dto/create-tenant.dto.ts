import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateTenantDto {
  @ApiProperty({ example: 'My Agency' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'my-agency' })
  @IsString()
  @IsNotEmpty()
  slug: string;
}
