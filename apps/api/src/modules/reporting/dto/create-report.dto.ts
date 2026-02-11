import { IsString, IsOptional, IsObject, IsIn } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateReportDto {
  @ApiProperty({ description: 'Report title' })
  @IsString()
  title!: string;

  @ApiProperty({
    description: 'Report type',
    enum: ['audit', 'compliance', 'executive', 'compliance-by-referentiel'],
  })
  @IsString()
  @IsIn(['audit', 'compliance', 'executive', 'compliance-by-referentiel'])
  type!: string;

  @ApiPropertyOptional({ description: 'Report filters' })
  @IsOptional()
  @IsObject()
  filters?: Record<string, unknown>;
}
