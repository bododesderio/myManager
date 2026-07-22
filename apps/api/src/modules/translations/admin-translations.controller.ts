import { Controller, Get, Patch, Param, Body } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { SuperAdmin } from '../../common/decorators/super-admin.decorator';
import { TranslationsService } from './translations.service';

@ApiTags('Admin - Translations')
@ApiBearerAuth()
@Controller('admin/translations')
export class AdminTranslationsController {
  constructor(private readonly translationsService: TranslationsService) {}

  @Get()
  @SuperAdmin()
  @ApiOperation({ summary: 'List translation keys grouped by locale (superadmin)' })
  async list() {
    return this.translationsService.list();
  }

  @Patch(':id')
  @SuperAdmin()
  @ApiOperation({ summary: 'Upsert a translation value for one language (superadmin)' })
  async update(
    @Param('id') id: string,
    @Body() body: { language: string; value: string },
  ) {
    return this.translationsService.update(id, body.language, body.value);
  }
}
