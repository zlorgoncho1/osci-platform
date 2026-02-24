import {
  IsString,
  IsEnum,
  IsOptional,
  IsUUID,
  IsDateString,
  IsArray,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Criticality } from '../../../common/enums';

export class CreateTaskDto {
  @ApiProperty({ description: 'Task title' })
  @IsString()
  title!: string;

  @ApiPropertyOptional({ description: 'Object UUID this task relates to' })
  @IsOptional()
  @IsUUID()
  objectId?: string;

  @ApiPropertyOptional({ description: 'Task description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ enum: Criticality, default: 'Medium' })
  @IsOptional()
  @IsEnum(Criticality)
  priority?: Criticality;

  @ApiPropertyOptional({ description: 'Assigned user ID (internal User UUID)' })
  @IsOptional()
  @IsString()
  assignedToId?: string;

  @ApiPropertyOptional({ description: 'Lead / responsible user ID (internal User UUID)' })
  @IsOptional()
  @IsString()
  leadId?: string;

  @ApiPropertyOptional({ description: 'SLA due date (ISO format)' })
  @IsOptional()
  @IsDateString()
  slaDue?: string;

  @ApiPropertyOptional({ description: 'Security project UUID' })
  @IsOptional()
  @IsUUID()
  projectId?: string;

  @ApiPropertyOptional({ description: 'Parent task UUID (for sub-tasks)' })
  @IsOptional()
  @IsUUID()
  parentTaskId?: string;

  @ApiPropertyOptional({ description: 'Labels/tags', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  labels?: string[];
}
