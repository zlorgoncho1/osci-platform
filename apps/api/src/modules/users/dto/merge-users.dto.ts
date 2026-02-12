import { IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class MergeUsersDto {
  @ApiProperty({ description: 'ID of the user to keep' })
  @IsUUID()
  keepUserId!: string;

  @ApiProperty({ description: 'ID of the user to remove (merged into keep)' })
  @IsUUID()
  removeUserId!: string;
}
