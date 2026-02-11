import {
  IsString,
  IsEnum,
  IsOptional,
  IsArray,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { ChecklistDomain, ChecklistType, Criticality } from '../../../common/enums';

export class UpdateChecklistDto {
  @ApiPropertyOptional({ description: 'Title of the checklist' })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({ description: 'Version' })
  @IsOptional()
  @IsString()
  version?: string;

  @ApiPropertyOptional({ enum: ChecklistDomain })
  @IsOptional()
  @IsEnum(ChecklistDomain)
  domain?: ChecklistDomain;

  @ApiPropertyOptional({ enum: ChecklistType })
  @IsOptional()
  @IsEnum(ChecklistType)
  checklistType?: ChecklistType;

  @ApiPropertyOptional({ enum: Criticality })
  @IsOptional()
  @IsEnum(Criticality)
  criticality?: Criticality;

  @ApiPropertyOptional({
    description: 'Applicable object types',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  applicability?: string[];

  @ApiPropertyOptional({ description: 'Description of the checklist' })
  @IsOptional()
  @IsString()
  description?: string;
}
