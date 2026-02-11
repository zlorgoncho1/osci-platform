import { IsString, IsOptional, IsUUID, IsObject, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AssetType, Criticality } from '../../../common/enums';

export class CreateAssetDto {
  @ApiProperty({ description: 'Asset name' })
  @IsString()
  name!: string;

  @ApiProperty({ description: 'Asset type', enum: AssetType })
  @IsEnum(AssetType)
  type!: AssetType;

  @ApiPropertyOptional({ description: 'Asset description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Asset criticality', enum: Criticality })
  @IsOptional()
  @IsEnum(Criticality)
  criticality?: Criticality;

  @ApiPropertyOptional({ description: 'Related object UUID' })
  @IsOptional()
  @IsUUID()
  objectId?: string;

  @ApiPropertyOptional({ description: 'Additional metadata' })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}
