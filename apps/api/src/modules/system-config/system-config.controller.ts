import { Controller, Get, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { SuperAdmin } from '../../common/decorators/super-admin.decorator';
import { SystemConfigService } from './system-config.service';
import { UpsertConfigDto } from './dto/upsert-config.dto';

@ApiTags('System Config')
@ApiBearerAuth()
@Controller('admin/system-config')
export class SystemConfigController {
  constructor(private readonly systemConfigService: SystemConfigService) {}

  @Get()
  @SuperAdmin()
  @ApiOperation({ summary: 'List system configurations (superadmin only)' })
  @ApiQuery({ name: 'category', required: false, description: 'Filter by category' })
  async findAll(@Query('category') category?: string) {
    return this.systemConfigService.findAll(category);
  }

  @Put(':key')
  @SuperAdmin()
  @ApiOperation({ summary: 'Upsert a system configuration (superadmin only)' })
  async upsert(@Param('key') key: string, @Body() body: UpsertConfigDto) {
    return this.systemConfigService.upsert(key, body);
  }

  @Delete(':key')
  @SuperAdmin()
  @ApiOperation({ summary: 'Delete a system configuration (superadmin only)' })
  async remove(@Param('key') key: string) {
    return this.systemConfigService.delete(key);
  }
}
