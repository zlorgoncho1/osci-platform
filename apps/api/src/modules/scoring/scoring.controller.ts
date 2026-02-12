import {
  Controller,
  Get,
  Post,
  Param,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PolicyGuard } from '../../common/guards/policy.guard';
import { ScoringService } from './scoring.service';
import { Score } from './entities/score.entity';

@ApiTags('scores')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PolicyGuard)
@Controller('scores')
export class ScoringController {
  constructor(private readonly scoringService: ScoringService) {}

  @Get('object/:objectId')
  async getScoreForObject(
    @Param('objectId', ParseUUIDPipe) objectId: string,
  ): Promise<Score | null> {
    return this.scoringService.getScoreForObject(objectId);
  }

  @Get('global')
  async getGlobalScore(): Promise<{
    globalScore: number;
    objectCount: number;
    scores: Score[];
  }> {
    return this.scoringService.getGlobalScore();
  }

  @Post('compute/:objectId')
  async computeScore(
    @Param('objectId', ParseUUIDPipe) objectId: string,
  ): Promise<Score> {
    return this.scoringService.computeScore(objectId);
  }
}
