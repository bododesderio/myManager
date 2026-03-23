import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { SalesLeadsService } from './sales-leads.service';
import { Public } from '../../common/decorators/public.decorator';
import { SuperAdmin } from '../../common/decorators/super-admin.decorator';

@ApiTags('Sales Leads')
@Controller('sales-leads')
export class SalesLeadsController {
  constructor(private readonly salesLeadsService: SalesLeadsService) {}

  @Public()
  @Post()
  @ApiOperation({ summary: 'Submit a contact sales form (public)' })
  async submit(@Body() body: {
    name: string; email: string; company?: string; phone?: string;
    planInterest: string; teamSize?: number; message: string;
  }) {
    return this.salesLeadsService.submit(body);
  }

  @SuperAdmin()
  @Get()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List sales leads (superadmin)' })
  async list(
    @Query('status') status?: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
  ) {
    return this.salesLeadsService.list(status, page, limit);
  }

  @SuperAdmin()
  @Get(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get lead details (superadmin)' })
  async getById(@Param('id') id: string) { return this.salesLeadsService.getById(id); }

  @SuperAdmin()
  @Put(':id/status')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update lead status (superadmin)' })
  async updateStatus(@Param('id') id: string, @Body() body: { status: string; notes?: string }) {
    return this.salesLeadsService.updateStatus(id, body.status, body.notes);
  }

  @SuperAdmin()
  @Delete(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a lead (superadmin)' })
  async deleteLead(@Param('id') id: string) { return this.salesLeadsService.delete(id); }
}
