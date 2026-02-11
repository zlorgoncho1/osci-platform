import { IsString, IsUUID, IsOptional, IsObject, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { RelationType } from '../../../common/enums';

export class CreateRelationDto {
  @ApiProperty({ description: 'Source asset UUID' })
  @IsUUID()
  sourceAssetId!: string;

  @ApiProperty({ description: 'Target asset UUID' })
  @IsUUID()
  targetAssetId!: string;

  @ApiProperty({ description: 'Type of relation', enum: RelationType })
  @IsEnum(RelationType)
  relationType!: RelationType;

  @ApiPropertyOptional({ description: 'Display label for the edge' })
  @IsOptional()
  @IsString()
  label?: string;

  @ApiPropertyOptional({ description: 'Additional metadata' })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}
