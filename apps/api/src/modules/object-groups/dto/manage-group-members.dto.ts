import { IsArray, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ManageGroupMembersDto {
  @ApiProperty({
    description: 'UUIDs of objects to add/remove',
    type: [String],
  })
  @IsArray()
  @IsUUID('4', { each: true })
  objectIds!: string[];
}
