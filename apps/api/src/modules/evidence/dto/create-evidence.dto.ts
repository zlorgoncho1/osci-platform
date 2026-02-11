import { IsString, IsOptional, IsUUID, IsObject } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class CreateEvidenceDto {
  @ApiPropertyOptional({ description: 'Object UUID this evidence relates to' })
  @IsOptional()
  @IsUUID()
  objectId?: string;

  @ApiPropertyOptional({ description: 'Checklist run item UUID' })
  @IsOptional()
  @IsUUID()
  checklistRunItemId?: string;

  @ApiPropertyOptional({ description: 'Additional metadata' })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}
