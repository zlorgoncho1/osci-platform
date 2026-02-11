import { IsString, IsEnum, IsOptional, IsObject } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ReferentielType } from '../../../common/enums';
import { ChecklistDomain } from '../../../common/enums';

export class CreateReferentielDto {
  @ApiProperty({ description: 'Short code (e.g. ISO27001, NIST_CSF)' })
  @IsString()
  code!: string;

  @ApiProperty({ description: 'Display name' })
  @IsString()
  name!: string;

  @ApiPropertyOptional({ description: 'Description of the framework' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Version (e.g. 2022, v1.0)', default: '1.0' })
  @IsOptional()
  @IsString()
  version?: string;

  @ApiProperty({ enum: ReferentielType })
  @IsEnum(ReferentielType)
  type!: ReferentielType;

  @ApiPropertyOptional({ description: 'Domain (same as checklist domains)', enum: ChecklistDomain })
  @IsOptional()
  @IsEnum(ChecklistDomain)
  domain?: ChecklistDomain;

  @ApiPropertyOptional({ description: 'Additional metadata (URL, publication date, etc.)' })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}
