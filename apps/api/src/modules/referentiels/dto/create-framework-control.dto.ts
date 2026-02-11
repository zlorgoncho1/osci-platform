import { IsString, IsOptional, IsInt, IsObject, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateFrameworkControlDto {
  @ApiProperty({ description: 'Control code (e.g. A.5.12, AC-6)' })
  @IsString()
  code!: string;

  @ApiProperty({ description: 'Short title' })
  @IsString()
  title!: string;

  @ApiPropertyOptional({ description: 'Detailed description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Parent control ID for hierarchy' })
  @IsOptional()
  @IsUUID()
  parentControlId?: string;

  @ApiPropertyOptional({ description: 'Display order', default: 0 })
  @IsOptional()
  @IsInt()
  orderIndex?: number;

  @ApiPropertyOptional({ description: 'Additional metadata' })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}
