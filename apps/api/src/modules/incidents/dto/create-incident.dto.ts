import {
  IsString,
  IsEnum,
  IsOptional,
  IsUUID,
  IsObject,
  IsDateString,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IncidentSeverity } from '../../../common/enums';

export class CreateIncidentDto {
  @ApiProperty({ description: 'Object UUID this incident relates to' })
  @IsUUID()
  objectId!: string;

  @ApiProperty({ description: 'Incident title' })
  @IsString()
  title!: string;

  @ApiProperty({ description: 'Incident type' })
  @IsString()
  type!: string;

  @ApiProperty({ enum: IncidentSeverity })
  @IsEnum(IncidentSeverity)
  severity!: IncidentSeverity;

  @ApiPropertyOptional({ description: 'Incident details' })
  @IsOptional()
  @IsObject()
  details?: Record<string, unknown>;

  @ApiProperty({ description: 'When the incident occurred (ISO format)' })
  @IsDateString()
  occurredAt!: string;
}
