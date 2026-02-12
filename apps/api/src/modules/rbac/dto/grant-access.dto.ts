import { IsUUID, IsArray, IsEnum } from 'class-validator';
import { Action } from '../../../common/enums';

export class GrantAccessDto {
  @IsUUID()
  userId!: string;

  @IsArray()
  @IsEnum(Action, { each: true })
  actions!: Action[];
}

export class UpdateAccessDto {
  @IsArray()
  @IsEnum(Action, { each: true })
  actions!: Action[];
}
