import {
  IsString,
  IsEnum,
  IsOptional,
  IsNumber,
  IsInt,
  IsUUID,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ChecklistItemType, ReferenceType } from '../../../common/enums';

export class CreateChecklistItemDto {
  @ApiProperty({ description: 'Question for this checklist item' })
  @IsString()
  question!: string;

  @ApiProperty({ enum: ChecklistItemType })
  @IsEnum(ChecklistItemType)
  itemType!: ChecklistItemType;

  @ApiPropertyOptional({ description: 'Weight of this item', default: 1.0 })
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

  @ApiPropertyOptional({ description: 'Order index', default: 0 })
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
