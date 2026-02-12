import { IsString, IsOptional, IsArray, IsEnum, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ResourceType, Action } from '../../../common/enums';

export class PermissionDto {
  @IsEnum(ResourceType)
  resourceType!: ResourceType;

  @IsArray()
  @IsEnum(Action, { each: true })
  actions!: Action[];
}

export class CreateRoleDto {
  @IsString()
  name!: string;

  @IsString()
  slug!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PermissionDto)
  permissions?: PermissionDto[];
}
