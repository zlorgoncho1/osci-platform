import {
  IsString,
  IsEnum,
  IsOptional,
  IsObject,
  IsDateString,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IncidentSeverity } from '../../../common/enums';

export class UpdateIncidentDto {
  @ApiPropertyOptional({ description: 'Incident title' })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({ description: 'Incident type' })
  @IsOptional()
  @IsString()
  type?: string;

  @ApiPropertyOptional({ enum: IncidentSeverity })
  @IsOptional()
  @IsEnum(IncidentSeverity)
  severity?: IncidentSeverity;

  @ApiPropertyOptional({ description: 'Incident status' })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ description: 'Incident details' })
  @IsOptional()
  @IsObject()
  details?: Record<string, unknown>;

  @ApiPropertyOptional({ description: 'When the incident was resolved' })
  @IsOptional()
  @IsDateString()
  resolvedAt?: string;
}
