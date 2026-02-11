import { IsUUID, ValidateIf } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class StartChecklistRunDto {
  @ApiPropertyOptional({ description: 'UUID of the object to run the checklist against' })
  @ValidateIf((o) => !o.objectGroupId)
  @IsUUID()
  objectId?: string;

  @ApiPropertyOptional({ description: 'UUID of the object group - runs will be created for all objects in the group' })
  @ValidateIf((o) => !o.objectId)
  @IsUUID()
  objectGroupId?: string;
}
