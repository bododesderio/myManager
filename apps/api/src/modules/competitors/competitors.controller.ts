import { Controller, Get, Post, Delete, Body, Param, Query, Req } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { Request } from 'express';
import { getRequestWorkspaceId } from '../../common/http/request-context';
import { CompetitorsService } from './competitors.service';

@ApiTags('Competitors')
@ApiBearerAuth()
@Controller('competitors')
export class CompetitorsController {
  constructor(private readonly competitorsService: CompetitorsService) {}

  @Get()
  @ApiOperation({ summary: 'List tracked competitor profiles' })
  async list(@Query('workspaceId') workspaceId: string) { return this.competitorsService.list(workspaceId); }

  @Post()
  @ApiOperation({ summary: 'Add a competitor profile to track' })
  async add(@Req() req: Request, @Body() body: { workspaceId: string; platform: string; platformUsername: string; displayName: string }) {
    return this.competitorsService.add({
      ...body,
      workspaceId: getRequestWorkspaceId(req),
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get competitor profile with recent snapshots' })
  async getById(@Param('id') id: string) { return this.competitorsService.getById(id); }

  @Delete(':id')
  @ApiOperation({ summary: 'Stop tracking a competitor' })
  async remove(@Param('id') id: string) { return this.competitorsService.remove(id); }

  @Get(':id/snapshots')
  @ApiOperation({ summary: 'Get historical metric snapshots for competitor' })
  async getSnapshots(@Param('id') id: string, @Query('days') days: number = 30) {
    return this.competitorsService.getSnapshots(id, days);
  }

  @Get('benchmarks')
  @ApiOperation({ summary: 'Get benchmark comparison between your accounts and competitors' })
  async getBenchmarks(@Query('workspaceId') workspaceId: string, @Query('platform') platform: string) {
    return this.competitorsService.getBenchmarks(workspaceId, platform);
  }
}
