import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CartographyService } from './cartography.service';
import { CreateAssetDto } from './dto/create-asset.dto';
import { UpdateAssetDto } from './dto/update-asset.dto';
import { CreateRelationDto } from './dto/create-relation.dto';
import { UpdateRelationDto } from './dto/update-relation.dto';
import { Asset } from './entities/asset.entity';
import { Relation } from './entities/relation.entity';

@ApiTags('cartography')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('cartography')
export class CartographyController {
  constructor(private readonly cartographyService: CartographyService) {}

  // Topology
  @Get('topology')
  async getTopologyGraph() {
    return this.cartographyService.getTopologyGraph();
  }

  @Get('topology/enriched')
  async getEnrichedTopology() {
    return this.cartographyService.getEnrichedTopology();
  }

  @Get('impact/:assetId')
  async getImpactAnalysis(
    @Param('assetId', ParseUUIDPipe) assetId: string,
  ) {
    return this.cartographyService.getImpactAnalysis(assetId);
  }

  // Assets
  @Get('assets')
  async findAllAssets(): Promise<Asset[]> {
    return this.cartographyService.findAllAssets();
  }

  @Post('assets')
  async createAsset(@Body() dto: CreateAssetDto): Promise<Asset> {
    return this.cartographyService.createAsset(dto);
  }

  @Get('assets/:id')
  async findOneAsset(@Param('id', ParseUUIDPipe) id: string): Promise<Asset> {
    return this.cartographyService.findOneAsset(id);
  }

  @Patch('assets/:id')
  async updateAsset(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateAssetDto,
  ): Promise<Asset> {
    return this.cartographyService.updateAsset(id, dto);
  }

  @Delete('assets/:id')
  async removeAsset(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.cartographyService.removeAsset(id);
  }

  // Relations
  @Get('relations')
  async findAllRelations(): Promise<Relation[]> {
    return this.cartographyService.findAllRelations();
  }

  @Post('relations')
  async createRelation(@Body() dto: CreateRelationDto): Promise<Relation> {
    return this.cartographyService.createRelation(dto);
  }

  @Patch('relations/:id')
  async updateRelation(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateRelationDto,
  ): Promise<Relation> {
    return this.cartographyService.updateRelation(id, dto);
  }

  @Delete('relations/:id')
  async removeRelation(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<void> {
    return this.cartographyService.removeRelation(id);
  }
}
