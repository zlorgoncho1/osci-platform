import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsOptional,
  IsUUID,
  IsDateString,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ProjectStatus } from '../../../common/enums';

export class CreateProjectDto {
  @ApiProperty({ description: 'Project name' })
  @IsString()
  name!: string;

  @ApiPropertyOptional({ description: 'Project description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ enum: ProjectStatus, default: ProjectStatus.Planning })
  @IsOptional()
  @IsEnum(ProjectStatus)
  status?: ProjectStatus;

  @ApiProperty({ description: 'Owner / Lead user ID (internal User UUID)' })
  @IsString()
  @IsNotEmpty()
  ownerId!: string;

  @ApiPropertyOptional({ description: 'Start date (ISO format)' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'Target end date (ISO format)' })
  @IsOptional()
  @IsDateString()
  targetEndDate?: string;

  @ApiPropertyOptional({ description: 'Related object UUID' })
  @IsOptional()
  @IsUUID()
  objectId?: string;
}
