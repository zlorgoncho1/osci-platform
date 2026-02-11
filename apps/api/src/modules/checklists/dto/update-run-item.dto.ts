import { IsEnum, IsOptional, IsString, IsNumber } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { RunItemStatus } from '../../../common/enums';

export class UpdateRunItemDto {
  @ApiPropertyOptional({ enum: RunItemStatus })
  @IsOptional()
  @IsEnum(RunItemStatus)
  status?: RunItemStatus;

  @ApiPropertyOptional({ description: 'Answer or value for this item' })
  @IsOptional()
  @IsString()
  answer?: string;

  @ApiPropertyOptional({ description: 'Additional notes' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ description: 'Score for this item' })
  @IsOptional()
  @IsNumber()
  score?: number;
}
