import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { Request } from 'express';
import { Req } from '@nestjs/common';
import { Public } from '../../common/decorators/public.decorator';
import { SuperAdmin } from '../../common/decorators/super-admin.decorator';
import { BlogService } from './blog.service';

// ─── Public endpoints ────────────────────────────────────────────────

@Controller('blog')
export class BlogPublicController {
  constructor(private readonly blogService: BlogService) {}

  @Public()
  @Get()
  listPublished(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('category') category?: string,
    @Query('sort') sort?: 'recent' | 'views',
  ) {
    return this.blogService.listPublished({
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
      category,
      sort,
    });
  }

  @Public()
  @Get('categories')
  listCategories() {
    return this.blogService.listCategories();
  }

  @Public()
  @Get(':slug')
  getBySlug(@Param('slug') slug: string) {
    return this.blogService.getBySlug(slug);
  }
}

// ─── Admin endpoints ─────────────────────────────────────────────────

@Controller('admin/blog')
export class BlogAdminController {
  constructor(private readonly blogService: BlogService) {}

  @SuperAdmin()
  @Get()
  listAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.blogService.listAll({
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }

  @SuperAdmin()
  @Get(':id')
  getById(@Param('id') id: string) {
    return this.blogService.getById(id);
  }

  @SuperAdmin()
  @Post()
  create(
    @Req() req: Request,
    @Body()
    body: {
      title: string;
      slug: string;
      excerpt: string;
      body: string;
      category: string;
      tags?: string[];
      is_published?: boolean;
      published_at?: string | null;
      is_featured?: boolean;
      meta_title?: string;
      meta_desc?: string;
      cover_image?: string;
      og_image?: string;
    },
  ) {
    return this.blogService.create({
      ...body,
      author_id: (req as unknown as { user: { id: string } }).user.id,
    });
  }

  @SuperAdmin()
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body()
    body: {
      title?: string;
      slug?: string;
      excerpt?: string;
      body?: string;
      category?: string;
      tags?: string[];
      is_published?: boolean;
      published_at?: string | null;
      is_featured?: boolean;
      meta_title?: string;
      meta_desc?: string;
      cover_image?: string;
      og_image?: string;
    },
  ) {
    return this.blogService.update(id, body);
  }

  @SuperAdmin()
  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.blogService.delete(id);
  }
}
