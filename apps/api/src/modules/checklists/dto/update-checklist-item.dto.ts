import {
  IsString,
  IsEnum,
  IsOptional,
  IsNumber,
  IsInt,
  IsUUID,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { ChecklistItemType, ReferenceType } from '../../../common/enums';

export class UpdateChecklistItemDto {
  @ApiPropertyOptional({ description: 'Question for this checklist item' })
  @IsOptional()
  @IsString()
  question?: string;

  @ApiPropertyOptional({ enum: ChecklistItemType })
  @IsOptional()
  @IsEnum(ChecklistItemType)
  itemType?: ChecklistItemType;

  @ApiPropertyOptional({ description: 'Weight of this item' })
  @IsOptional()
  @IsNumber()
  weight?: number;

  @ApiPropertyOptional({ description: 'Expected evidence description' })
  @IsOptional()
  @IsString()
  expectedEvidence?: string;

  @ApiPropertyOptional({ enum: ReferenceType })
  @IsOptional()
  @IsEnum(ReferenceType)
  referenceType?: ReferenceType;

  @ApiPropertyOptional({ description: 'Reference identifier' })
  @IsOptional()
  @IsString()
  reference?: string;

  @ApiPropertyOptional({
    description: 'Framework control ID for mapping to a referentiel control',
  })
  @IsOptional()
  @IsUUID()
  frameworkControlId?: string;

  @ApiPropertyOptional({ description: 'Order index' })
  @IsOptional()
  @IsInt()
  orderIndex?: number;

  @ApiPropertyOptional({
    description: 'Title for auto-created task when non-conformant',
  })
  @IsOptional()
  @IsString()
  autoTaskTitle?: string;
}
