import { Controller, Get, Post, Patch, Delete, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { TestimonialsService } from './testimonials.service';
import { Public } from '../../common/decorators/public.decorator';
import { SuperAdmin } from '../../common/decorators/super-admin.decorator';

@ApiTags('Testimonials')
@Controller()
export class TestimonialsController {
  constructor(private readonly testimonialsService: TestimonialsService) {}

  @Get('testimonials')
  @Public()
  @ApiOperation({ summary: 'Get visible testimonials' })
  async getVisible(@Query('placement') placement?: string) {
    return this.testimonialsService.getVisible(placement);
  }

  @Get('admin/testimonials')
  @SuperAdmin()
  @ApiOperation({ summary: 'List all testimonials' })
  async listAll() {
    return this.testimonialsService.listAll();
  }

  @Post('admin/testimonials')
  @SuperAdmin()
  @ApiOperation({ summary: 'Create testimonial' })
  async create(@Body() body: {
    author_name: string;
    author_role: string;
    author_initials: string;
    company: string;
    quote: string;
    author_avatar_color?: string;
    rating?: number;
    placement?: string;
    order_index?: number;
    is_visible?: boolean;
  }) {
    return this.testimonialsService.create(body);
  }

  @Patch('admin/testimonials/:id')
  @SuperAdmin()
  @ApiOperation({ summary: 'Update testimonial' })
  async update(@Param('id') id: string, @Body() body: Record<string, unknown>) {
    return this.testimonialsService.update(id, body);
  }

  @Delete('admin/testimonials/:id')
  @SuperAdmin()
  @ApiOperation({ summary: 'Delete testimonial' })
  async delete(@Param('id') id: string) {
    return this.testimonialsService.delete(id);
  }
}
