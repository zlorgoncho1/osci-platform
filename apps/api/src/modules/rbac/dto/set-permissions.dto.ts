import {
  IsArray,
  ValidateNested,
  IsEnum,
  ArrayMinSize,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ResourceType, Action } from '../../../common/enums';

export class PermissionEntryDto {
  @IsEnum(ResourceType)
  resourceType!: ResourceType;

  @IsArray()
  @IsEnum(Action, { each: true })
  @ArrayMinSize(1)
  actions!: Action[];
}

export class SetPermissionsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PermissionEntryDto)
  permissions!: PermissionEntryDto[];
}
