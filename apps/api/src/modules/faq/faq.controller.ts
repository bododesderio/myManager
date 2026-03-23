import { Controller, Get, Post, Patch, Delete, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { FaqService } from './faq.service';
import { Public } from '../../common/decorators/public.decorator';
import { SuperAdmin } from '../../common/decorators/super-admin.decorator';

@ApiTags('FAQ')
@Controller()
export class FaqController {
  constructor(private readonly faqService: FaqService) {}

  @Get('faq')
  @Public()
  @ApiOperation({ summary: 'Get visible FAQ items' })
  async getVisibleFaqs(@Query('page') page?: string) {
    return this.faqService.getVisibleFaqs(page);
  }

  @Get('admin/faq')
  @SuperAdmin()
  @ApiOperation({ summary: 'List all FAQ items' })
  async listAll() {
    return this.faqService.listAll();
  }

  @Post('admin/faq')
  @SuperAdmin()
  @ApiOperation({ summary: 'Create FAQ item' })
  async create(
    @Body() body: { question: string; answer: string; page?: string; sortOrder?: number; visible?: boolean },
  ) {
    return this.faqService.create(body);
  }

  @Patch('admin/faq/:id')
  @SuperAdmin()
  @ApiOperation({ summary: 'Update FAQ item' })
  async update(
    @Param('id') id: string,
    @Body() body: { question?: string; answer?: string; page?: string; sortOrder?: number; visible?: boolean },
  ) {
    return this.faqService.update(id, body);
  }

  @Delete('admin/faq/:id')
  @SuperAdmin()
  @ApiOperation({ summary: 'Delete FAQ item' })
  async delete(@Param('id') id: string) {
    return this.faqService.delete(id);
  }
}
