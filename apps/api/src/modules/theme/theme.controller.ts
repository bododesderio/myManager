import { Controller, Get, Put, Post, Delete, Body, Param } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { ThemeService } from './theme.service';
import { SuperAdmin } from '../../common/decorators/super-admin.decorator';

@ApiTags('Theme')
@Controller('admin/theme')
export class ThemeController {
  constructor(private readonly themeService: ThemeService) {}

  @Get('active')
  @SuperAdmin()
  @ApiOperation({ summary: 'Get active theme config' })
  async getActive() {
    return this.themeService.getActiveTheme();
  }

  @Put('active')
  @SuperAdmin()
  @ApiOperation({ summary: 'Update active theme config' })
  async updateActive(@Body() body: Record<string, unknown>) {
    return this.themeService.updateActiveTheme(body);
  }

  @Get('presets')
  @SuperAdmin()
  @ApiOperation({ summary: 'List all theme presets' })
  async listPresets() {
    return this.themeService.listPresets();
  }

  @Post('apply-preset/:id')
  @SuperAdmin()
  @ApiOperation({ summary: 'Apply a theme preset' })
  async applyPreset(@Param('id') id: string) {
    return this.themeService.applyPreset(id);
  }

  @Post('presets')
  @SuperAdmin()
  @ApiOperation({ summary: 'Create custom theme preset' })
  async createPreset(@Body() body: { name: string; config: Record<string, unknown>; isBuiltIn?: boolean }) {
    return this.themeService.createPreset(body);
  }

  @Delete('presets/:id')
  @SuperAdmin()
  @ApiOperation({ summary: 'Delete a theme preset' })
  async deletePreset(@Param('id') id: string) {
    return this.themeService.deletePreset(id);
  }
}
