import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePageDto {
  @ApiProperty({ example: 'about-us' })
  slug: string;

  @ApiProperty({ example: 'About Us' })
  title: string;

  @ApiProperty({ example: '<p>Our story...</p>' })
  content: string;

  @ApiPropertyOptional({ default: true })
  isPublished?: boolean;

  @ApiPropertyOptional({ default: 0 })
  order?: number;
}

export class UpdatePageDto {
  @ApiPropertyOptional()
  slug?: string;

  @ApiPropertyOptional()
  title?: string;

  @ApiPropertyOptional()
  content?: string;

  @ApiPropertyOptional()
  isPublished?: boolean;

  @ApiPropertyOptional()
  order?: number;
}
