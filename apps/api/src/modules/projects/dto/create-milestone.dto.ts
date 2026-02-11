import {
  IsString,
  IsEnum,
  IsOptional,
  IsDateString,
  IsInt,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MilestoneStatus } from '../../../common/enums';

export class CreateMilestoneDto {
  @ApiProperty({ description: 'Milestone title' })
  @IsString()
  title!: string;

  @ApiPropertyOptional({ description: 'Milestone description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ enum: MilestoneStatus, default: MilestoneStatus.Pending })
  @IsOptional()
  @IsEnum(MilestoneStatus)
  status?: MilestoneStatus;

  @ApiPropertyOptional({ description: 'Due date (ISO format)' })
  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @ApiPropertyOptional({ description: 'Display order', default: 0 })
  @IsOptional()
  @IsInt()
  order?: number;
}
