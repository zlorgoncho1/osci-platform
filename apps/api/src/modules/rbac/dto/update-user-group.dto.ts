import { IsString, IsOptional, MinLength, Matches } from 'class-validator';

export class UpdateUserGroupDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  name?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @Matches(/^[a-z0-9_-]+$/, {
    message: 'slug must contain only lowercase letters, numbers, hyphens and underscores',
  })
  slug?: string;

  @IsOptional()
  @IsString()
  description?: string;
}
