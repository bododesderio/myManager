import { Controller, Post, Get, Patch, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { ContactService } from './contact.service';
import { Public } from '../../common/decorators/public.decorator';
import { SuperAdmin } from '../../common/decorators/super-admin.decorator';

@ApiTags('Contact')
@Controller()
export class ContactController {
  constructor(private readonly contactService: ContactService) {}

  @Post('contact')
  @Public()
  @ApiOperation({ summary: 'Submit a contact lead' })
  async submitLead(
    @Body() body: { name: string; email: string; company?: string; teamSize?: string; message: string },
  ) {
    return this.contactService.createLead(body);
  }

  @Get('admin/leads')
  @SuperAdmin()
  @ApiOperation({ summary: 'List contact leads' })
  async listLeads(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
    @Query('status') status?: string,
  ) {
    return this.contactService.listLeads(+page, +limit, status);
  }

  @Patch('admin/leads/:id')
  @SuperAdmin()
  @ApiOperation({ summary: 'Update lead status/notes' })
  async updateLead(
    @Param('id') id: string,
    @Body() body: { status?: string; notes?: string; assigned_to?: string | null },
  ) {
    return this.contactService.updateLead(id, body as any);
  }
}
