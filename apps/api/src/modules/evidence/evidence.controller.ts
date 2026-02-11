import {
  Controller,
  Get,
  Post,
  Param,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Body,
  Res,
  ParseUUIDPipe,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { Response } from 'express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { EvidenceService } from './evidence.service';
import { CreateEvidenceDto } from './dto/create-evidence.dto';
import { Evidence } from './entities/evidence.entity';

@ApiTags('evidence')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('evidence')
export class EvidenceController {
  constructor(private readonly evidenceService: EvidenceService) {}

  @Post()
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
        objectId: { type: 'string', format: 'uuid' },
        checklistRunItemId: { type: 'string', format: 'uuid' },
      },
    },
  })
  async upload(
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: CreateEvidenceDto,
    @CurrentUser() user: { sub: string },
  ): Promise<Evidence> {
    return this.evidenceService.upload(
      file,
      user.sub,
      dto.objectId,
      dto.checklistRunItemId,
      dto.metadata,
    );
  }

  @Get()
  async findAll(): Promise<Evidence[]> {
    return this.evidenceService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<Evidence> {
    return this.evidenceService.findOne(id);
  }

  @Get(':id/download')
  async download(
    @Param('id', ParseUUIDPipe) id: string,
    @Res() res: Response,
  ): Promise<void> {
    const { stream, evidence } = await this.evidenceService.download(id);
    res.setHeader('Content-Type', evidence.mimeType);
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${evidence.filename}"`,
    );
    stream.pipe(res);
  }
}
