import { Controller, Get, Post, Patch, Delete, Param, Body } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { SuperAdmin } from '../../common/decorators/super-admin.decorator';
import { EmailTemplatesService } from './email-templates.service';

interface TemplateBody {
  name: string;
  subject: string;
  trigger: string;
  body: string;
}

@ApiTags('Admin - Email Templates')
@ApiBearerAuth()
@Controller('admin/email-templates')
export class EmailTemplatesController {
  constructor(private readonly emailTemplatesService: EmailTemplatesService) {}

  @Get()
  @SuperAdmin()
  @ApiOperation({ summary: 'List email templates (superadmin)' })
  async list() {
    return this.emailTemplatesService.list();
  }

  @Post()
  @SuperAdmin()
  @ApiOperation({ summary: 'Create an email template (superadmin)' })
  async create(@Body() body: TemplateBody) {
    return this.emailTemplatesService.create(body);
  }

  @Patch(':id')
  @SuperAdmin()
  @ApiOperation({ summary: 'Update an email template (superadmin)' })
  async update(@Param('id') id: string, @Body() body: Partial<TemplateBody>) {
    return this.emailTemplatesService.update(id, body);
  }

  @Delete(':id')
  @SuperAdmin()
  @ApiOperation({ summary: 'Delete an email template (superadmin)' })
  async remove(@Param('id') id: string) {
    return this.emailTemplatesService.remove(id);
  }
}
