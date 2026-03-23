import { Controller, Get, Put, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { BrandService } from './brand.service';

@ApiTags('Brand')
@Controller('brand')
export class BrandController {
  constructor(private readonly brandService: BrandService) {}

  @Get()
  @ApiOperation({ summary: 'Get platform brand configuration (public, cached)' })
  async getPlatformBrand() {
    return this.brandService.getPlatformBrand();
  }

  @Put()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update platform brand configuration (superadmin)' })
  async updatePlatformBrand(@Body() body: Record<string, unknown>) {
    return this.brandService.updatePlatformBrand(body);
  }

  @Get('workspace/:workspaceId')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get workspace brand configuration' })
  async getWorkspaceBrand(@Param('workspaceId') workspaceId: string) {
    return this.brandService.getWorkspaceBrand(workspaceId);
  }

  @Put('workspace/:workspaceId')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update workspace brand configuration' })
  async updateWorkspaceBrand(@Param('workspaceId') workspaceId: string, @Body() body: Record<string, unknown>) {
    return this.brandService.updateWorkspaceBrand(workspaceId, body);
  }

  @Get('project/:projectId')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get project brand configuration' })
  async getProjectBrand(@Param('projectId') projectId: string) {
    return this.brandService.getProjectBrand(projectId);
  }

  @Put('project/:projectId')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update project brand configuration' })
  async updateProjectBrand(@Param('projectId') projectId: string, @Body() body: Record<string, unknown>) {
    return this.brandService.updateProjectBrand(projectId, body);
  }

  @Get('resolve')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Resolve brand config with inheritance (platform > workspace > project)' })
  async resolveBrand(@Query('workspaceId') workspaceId?: string, @Query('projectId') projectId?: string) {
    return this.brandService.resolveBrand(workspaceId, projectId);
  }
}
