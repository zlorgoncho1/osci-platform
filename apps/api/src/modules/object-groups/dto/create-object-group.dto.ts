import { IsString, IsOptional, IsUUID, IsArray } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateObjectGroupDto {
  @ApiProperty({ description: 'Name of the group' })
  @IsString()
  name!: string;

  @ApiPropertyOptional({ description: 'Description of the group' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: 'UUIDs of objects to add to the group',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  objectIds?: string[];
}
