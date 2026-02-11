import { PartialType } from '@nestjs/swagger';
import { CreateObjectGroupDto } from './create-object-group.dto';

export class UpdateObjectGroupDto extends PartialType(CreateObjectGroupDto) {}
