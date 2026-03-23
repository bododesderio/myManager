import { Controller, Post, Get, Body, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { NewsletterService } from './newsletter.service';
import { Public } from '../../common/decorators/public.decorator';
import { SuperAdmin } from '../../common/decorators/super-admin.decorator';

@ApiTags('Newsletter')
@Controller()
export class NewsletterController {
  constructor(private readonly newsletterService: NewsletterService) {}

  @Post('newsletter/subscribe')
  @Public()
  @ApiOperation({ summary: 'Subscribe to newsletter' })
  async subscribe(@Body() body: { email: string; source?: string }) {
    return this.newsletterService.subscribe(body.email, body.source);
  }

  @Get('admin/newsletter/subscribers')
  @SuperAdmin()
  @ApiOperation({ summary: 'List all newsletter subscribers' })
  async listSubscribers(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
  ) {
    return this.newsletterService.listSubscribers(+page, +limit);
  }
}
