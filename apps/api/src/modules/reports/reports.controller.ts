import { Controller, Get, Post, Put, Delete, Body, Param, Query, Req } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { Request } from 'express';
import { ReportsService } from './reports.service';

@ApiTags('Reports')
@ApiBearerAuth()
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get()
  @ApiOperation({ summary: 'List generated reports' })
  async list(@Query('workspaceId') workspaceId: string, @Query('page') page: number = 1, @Query('limit') limit: number = 20) {
    return this.reportsService.list(workspaceId, page, limit);
  }

  @Post('generate')
  @ApiOperation({ summary: 'Generate a new report' })
  async generate(@Req() req: Request, @Body() body: {
    workspaceId: string; projectId?: string; type: string; fileFormat: string;
    dateRange: { start: string; end: string }; platforms?: string[];
  }) {
    const userId = (req as unknown as { user: { id: string } }).user.id;
    return this.reportsService.generate(userId, body);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get report details and download URL' })
  async getReport(@Param('id') id: string) { return this.reportsService.getById(id); }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a report' })
  async deleteReport(@Param('id') id: string) { return this.reportsService.delete(id); }

  @Get('configs')
  @ApiOperation({ summary: 'List saved report configurations' })
  async listConfigs(@Query('workspaceId') workspaceId: string) {
    return this.reportsService.listConfigs(workspaceId);
  }

  @Post('configs')
  @ApiOperation({ summary: 'Save a report configuration with optional schedule' })
  async saveConfig(@Body() body: {
    workspaceId: string; name: string; type: string; format: string;
    platforms: string[]; schedule?: { frequency: string; dayOfMonth?: number };
  }) { return this.reportsService.saveConfig(body); }

  @Put('configs/:id')
  @ApiOperation({ summary: 'Update a report configuration' })
  async updateConfig(@Param('id') id: string, @Body() body: Record<string, unknown>) {
    return this.reportsService.updateConfig(id, body);
  }

  @Delete('configs/:id')
  @ApiOperation({ summary: 'Delete a report configuration' })
  async deleteConfig(@Param('id') id: string) { return this.reportsService.deleteConfig(id); }
}
