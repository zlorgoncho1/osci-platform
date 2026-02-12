import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Res,
  UseGuards,
  ParseUUIDPipe,
  UnauthorizedException,
} from '@nestjs/common';
import { Response } from 'express';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PolicyGuard } from '../../common/guards/policy.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ReportingService } from './reporting.service';
import { CreateReportDto } from './dto/create-report.dto';
import { Report } from './entities/report.entity';

@ApiTags('reports')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PolicyGuard)
@Controller('reports')
export class ReportingController {
  constructor(private readonly reportingService: ReportingService) {}

  @Get()
  async findAll(): Promise<Report[]> {
    return this.reportingService.findAll();
  }

  @Post()
  async generate(
    @Body() dto: CreateReportDto,
    @CurrentUser() user: { sub: string },
  ): Promise<Report> {
    if (!user?.sub) {
      throw new UnauthorizedException('User identity (sub) not found in token');
    }
    return this.reportingService.generateReport(dto, user.sub);
  }

  @Get(':id/download')
  async download(
    @Param('id', ParseUUIDPipe) id: string,
    @Res() res: Response,
  ): Promise<void> {
    const report = await this.reportingService.findOne(id);
    const filename = `${(report.title || 'report').replace(/[^a-zA-Z0-9_\-\s]/g, '')}.json`;
    const json = JSON.stringify(report.content, null, 2);

    res.set({
      'Content-Type': 'application/json',
      'Content-Disposition': `attachment; filename="${filename}"`,
    });
    res.send(json);
  }

  @Get(':id')
  async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<Report> {
    return this.reportingService.findOne(id);
  }
}
