import { Controller, Get, Query, ParseIntPipe, DefaultValuePipe } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AuditService } from './audit.service';

@ApiTags('Audit')
@ApiBearerAuth()
@Controller('audit')
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  @ApiOperation({ summary: 'List audit log entries' })
  async list(
    @Query('workspaceId') workspaceId: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit: number,
    @Query('action') action?: string,
    @Query('userId') userId?: string,
    @Query('resourceType') resourceType?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.auditService.list(workspaceId, { action, userId, resourceType, startDate, endDate }, page, limit);
  }

  @Get('actions')
  @ApiOperation({ summary: 'List distinct audit action types' })
  async listActions(@Query('workspaceId') workspaceId: string) {
    return this.auditService.listActionTypes(workspaceId);
  }

  @Get('export')
  @ApiOperation({ summary: 'Export audit log as CSV' })
  async export(
    @Query('workspaceId') workspaceId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.auditService.exportCsv(workspaceId, startDate, endDate);
  }
}
