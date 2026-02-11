import {
  IsString,
  IsEnum,
  IsOptional,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ChecklistDomain, ChecklistType, Criticality } from '../../../common/enums';
import { CreateChecklistItemDto } from '../../checklists/dto/create-checklist-item.dto';

export class CreateReferenceChecklistDto {
  @ApiProperty({ description: 'Title of the reference checklist' })
  @IsString()
  title!: string;

  @ApiPropertyOptional({ description: 'Version', default: '1.0' })
  @IsOptional()
  @IsString()
  version?: string;

  @ApiProperty({ enum: ChecklistDomain })
  @IsEnum(ChecklistDomain)
  domain!: ChecklistDomain;

  @ApiPropertyOptional({ enum: ChecklistType, default: ChecklistType.Compliance })
  @IsOptional()
  @IsEnum(ChecklistType)
  checklistType?: ChecklistType;

  @ApiProperty({ enum: Criticality })
  @IsEnum(Criticality)
  criticality!: Criticality;

  @ApiProperty({
    description: 'Applicable object types',
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  applicability!: string[];

  @ApiPropertyOptional({ description: 'Description of the checklist' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: 'Checklist items (can be empty for new checklist)',
    type: [CreateChecklistItemDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateChecklistItemDto)
  items?: CreateChecklistItemDto[];
}
