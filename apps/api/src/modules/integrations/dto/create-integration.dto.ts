import { IsString, IsObject, IsOptional, IsBoolean, IsIn } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateIntegrationDto {
  @ApiProperty({
    description: 'Integration type',
    enum: ['git', 'cicd', 'cloud', 'iam', 'siem', 'secrets'],
  })
  @IsString()
  @IsIn(['git', 'cicd', 'cloud', 'iam', 'siem', 'secrets'])
  type!: string;

  @ApiProperty({ description: 'Integration name' })
  @IsString()
  name!: string;

  @ApiProperty({ description: 'Integration configuration' })
  @IsObject()
  config!: Record<string, unknown>;

  @ApiPropertyOptional({ description: 'Whether the integration is enabled', default: true })
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;
}
