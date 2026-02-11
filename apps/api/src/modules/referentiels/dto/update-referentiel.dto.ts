import { IsString, IsEnum, IsOptional, IsObject } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { ReferentielType } from '../../../common/enums';
import { ChecklistDomain } from '../../../common/enums';

export class UpdateReferentielDto {
  @ApiPropertyOptional({ description: 'Short code' })
  @IsOptional()
  @IsString()
  code?: string;

  @ApiPropertyOptional({ description: 'Display name' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: 'Description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Version' })
  @IsOptional()
  @IsString()
  version?: string;

  @ApiPropertyOptional({ enum: ReferentielType })
  @IsOptional()
  @IsEnum(ReferentielType)
  type?: ReferentielType;

  @ApiPropertyOptional({ description: 'Domain', enum: ChecklistDomain })
  @IsOptional()
  @IsEnum(ChecklistDomain)
  domain?: ChecklistDomain | null;

  @ApiPropertyOptional({ description: 'Metadata' })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}
