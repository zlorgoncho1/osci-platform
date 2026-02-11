import {
  IsString,
  IsEnum,
  IsOptional,
  IsUUID,
  IsObject,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ObjectType } from '../../../common/enums';

export class CreateObjectDto {
  @ApiProperty({ description: 'Name of the object' })
  @IsString()
  name!: string;

  @ApiProperty({ enum: ObjectType, description: 'Type of the object' })
  @IsEnum(ObjectType)
  type!: ObjectType;

  @ApiPropertyOptional({ description: 'Description of the object' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Additional metadata' })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;

  @ApiPropertyOptional({ description: 'Parent object UUID' })
  @IsOptional()
  @IsUUID()
  parentId?: string;
}
