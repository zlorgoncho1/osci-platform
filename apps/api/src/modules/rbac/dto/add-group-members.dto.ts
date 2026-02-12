import { IsArray, IsUUID } from 'class-validator';

export class AddGroupMembersDto {
  @IsArray()
  @IsUUID('4', { each: true })
  userIds!: string[];
}
