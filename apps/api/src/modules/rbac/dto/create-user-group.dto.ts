import { IsString, IsOptional, MinLength, Matches } from 'class-validator';

export class CreateUserGroupDto {
  @IsString()
  @MinLength(1)
  name!: string;

  @IsString()
  @MinLength(1)
  @Matches(/^[a-z0-9_-]+$/, {
    message: 'slug must contain only lowercase letters, numbers, hyphens and underscores',
  })
  slug!: string;

  @IsOptional()
  @IsString()
  description?: string;
}
