import {
  Controller,
  Get,
  Patch,
  Post,
  Delete,
  Param,
  Body,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';
import { SuperAdmin } from '../../common/decorators/super-admin.decorator';
import { CmsService } from './cms.service';

@ApiTags('CMS')
@Controller()
export class CmsController {
  constructor(private readonly cmsService: CmsService) {}

  // ───────────────────────────────────────────────
  // Public endpoints
  // ───────────────────────────────────────────────

  @Get('cms/brand')
  @Public()
  @ApiOperation({ summary: 'Get brand configuration (public, cached)' })
  async getBrand() {
    return this.cmsService.getBrand();
  }

  @Get('cms/theme')
  @Public()
  @ApiOperation({ summary: 'Get active theme configuration (public, cached)' })
  async getTheme() {
    return this.cmsService.getTheme();
  }

  @Get('cms/nav')
  @Public()
  @ApiOperation({ summary: 'Get navigation links grouped by placement (public, cached)' })
  async getNav() {
    return this.cmsService.getNav();
  }

  @Get('cms/pages/:slug')
  @Public()
  @ApiOperation({ summary: 'Get CMS page with visible sections and fields (public, cached)' })
  async getPublicPage(@Param('slug') slug: string) {
    return this.cmsService.getPublicPage(slug);
  }

  // ───────────────────────────────────────────────
  // Admin endpoints
  // ───────────────────────────────────────────────

  @Get('admin/cms/pages')
  @SuperAdmin()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List all CMS pages (admin)' })
  async listPages() {
    return this.cmsService.listPages();
  }

  @Get('admin/cms/pages/:slug')
  @SuperAdmin()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get CMS page with all sections including hidden (admin)' })
  async getAdminPage(@Param('slug') slug: string) {
    return this.cmsService.getAdminPage(slug);
  }

  @Patch('admin/cms/pages/:slug')
  @SuperAdmin()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update CMS page metadata (admin)' })
  async updatePage(
    @Param('slug') slug: string,
    @Body()
    body: {
      title?: string;
      meta_title?: string | null;
      meta_desc?: string | null;
      og_image?: string | null;
      is_published?: boolean;
    },
  ) {
    return this.cmsService.updatePage(slug, body);
  }

  @Patch('admin/cms/fields/:id')
  @SuperAdmin()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a CMS field value (admin)' })
  async updateField(
    @Param('id') id: string,
    @Body() body: { value: string },
  ) {
    return this.cmsService.updateField(id, body.value);
  }

  @Patch('admin/cms/sections/:id')
  @SuperAdmin()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Toggle CMS section visibility (admin)' })
  async toggleSection(
    @Param('id') id: string,
    @Body() body: { is_visible: boolean },
  ) {
    return this.cmsService.toggleSectionVisibility(id, body.is_visible);
  }

  @Patch('admin/cms/brand')
  @SuperAdmin()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update brand configuration (admin)' })
  async updateBrand(@Body() body: Record<string, unknown>) {
    return this.cmsService.updateBrand(body);
  }

  @Patch('admin/cms/theme')
  @SuperAdmin()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update theme configuration (admin)' })
  async updateTheme(@Body() body: Record<string, unknown>) {
    return this.cmsService.updateTheme(body);
  }

  @Get('admin/cms/nav-links')
  @SuperAdmin()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List all navigation links (admin)' })
  async listNavLinks() {
    return this.cmsService.listNavLinks();
  }

  @Post('admin/cms/nav-links')
  @SuperAdmin()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create navigation link (admin)' })
  async createNavLink(
    @Body()
    body: {
      label: string;
      href: string;
      placement: string;
      order_index?: number;
      is_visible?: boolean;
      is_external?: boolean;
    },
  ) {
    return this.cmsService.createNavLink(body);
  }

  @Patch('admin/cms/nav-links/:id')
  @SuperAdmin()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update navigation link (admin)' })
  async updateNavLink(
    @Param('id') id: string,
    @Body()
    body: {
      label?: string;
      href?: string;
      placement?: string;
      order_index?: number;
      is_visible?: boolean;
      is_external?: boolean;
    },
  ) {
    return this.cmsService.updateNavLink(id, body);
  }

  @Delete('admin/cms/nav-links/:id')
  @SuperAdmin()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete navigation link (admin)' })
  async deleteNavLink(@Param('id') id: string) {
    return this.cmsService.deleteNavLink(id);
  }

  @Post('admin/cms/revalidate')
  @SuperAdmin()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Trigger ISR revalidation on the web frontend (admin)' })
  async revalidate() {
    return this.cmsService.triggerRevalidation();
  }
}
