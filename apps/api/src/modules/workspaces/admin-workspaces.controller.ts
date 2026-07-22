import { Controller, Get, Query, DefaultValuePipe, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { SuperAdmin } from '../../common/decorators/super-admin.decorator';
import { WorkspacesService } from './workspaces.service';

@ApiTags('Admin - Workspaces')
@ApiBearerAuth()
@Controller('admin/workspaces')
export class AdminWorkspacesController {
  constructor(private readonly workspacesService: WorkspacesService) {}

  @Get()
  @SuperAdmin()
  @ApiOperation({ summary: 'List all workspaces (superadmin)' })
  async list(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit: number,
  ) {
    return this.workspacesService.listAllForAdmin(page, limit);
  }
}
