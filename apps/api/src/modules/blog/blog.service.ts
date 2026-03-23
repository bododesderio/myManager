import {
  Injectable,
  Logger,
  NotFoundException,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { PrismaService } from '../../prisma.service';

@Injectable()
export class BlogService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(BlogService.name);
  private redis!: Redis;

  private readonly CACHE_TTL = 300; // 5 minutes

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  onModuleInit() {
    this.redis = new Redis(this.config.get<string>('REDIS_URL') || 'redis://localhost:6379');
    this.redis.on('error', (err) =>
      this.logger.error('Redis connection error', err),
    );
  }

  async onModuleDestroy() {
    await this.redis?.quit();
  }

  // ─── Public ────────────────────────────────────────────────────────

  async listPublished(query: {
    page?: number;
    limit?: number;
    category?: string;
    sort?: 'recent' | 'views';
  }) {
    const page = Math.max(query.page ?? 1, 1);
    const limit = Math.min(Math.max(query.limit ?? 20, 1), 100);
    const sort = query.sort ?? 'recent';

    const cacheKey = `blog:list:${page}:${limit}:${query.category ?? 'all'}:${sort}`;
    const cached = await this.redis.get(cacheKey);
    if (cached) return JSON.parse(cached);

    const where: Record<string, unknown> = { is_published: true };
    if (query.category) {
      where.category = query.category;
    }

    const orderBy =
      sort === 'views'
        ? { view_count: 'desc' as const }
        : { created_at: 'desc' as const };

    const [data, total] = await this.prisma.$transaction([
      this.prisma.blogPost.findMany({
        where,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.blogPost.count({ where }),
    ]);

    const result = {
      data,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };

    await this.redis.set(cacheKey, JSON.stringify(result), 'EX', this.CACHE_TTL);
    return result;
  }

  async getBySlug(slug: string) {
    const cacheKey = `blog:post:${slug}`;
    const cached = await this.redis.get(cacheKey);

    let post: any;

    if (cached) {
      post = JSON.parse(cached);
    } else {
      post = await this.prisma.blogPost.findFirst({
        where: { slug, is_published: true },
      });
      if (!post) throw new NotFoundException('Blog post not found');

      await this.redis.set(cacheKey, JSON.stringify(post), 'EX', this.CACHE_TTL);
    }

    // Increment view count outside of cache
    await this.prisma.blogPost.update({
      where: { id: post.id },
      data: { view_count: { increment: 1 } },
    });

    return { ...post, view_count: post.view_count + 1 };
  }

  async listCategories() {
    const cacheKey = 'blog:list:categories';
    const cached = await this.redis.get(cacheKey);
    if (cached) return JSON.parse(cached);

    const categories = await this.prisma.blogPost.groupBy({
      by: ['category'],
      where: { is_published: true },
      _count: { id: true },
    });

    const result = categories.map((c) => ({
      category: c.category,
      post_count: c._count.id,
    }));

    await this.redis.set(cacheKey, JSON.stringify(result), 'EX', this.CACHE_TTL);
    return result;
  }

  // ─── Admin ─────────────────────────────────────────────────────────

  async listAll(query: { page?: number; limit?: number }) {
    const page = Math.max(query.page ?? 1, 1);
    const limit = Math.min(Math.max(query.limit ?? 20, 1), 100);

    const [data, total] = await this.prisma.$transaction([
      this.prisma.blogPost.findMany({
        orderBy: { created_at: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.blogPost.count(),
    ]);

    return {
      data,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getById(id: string) {
    const post = await this.prisma.blogPost.findUnique({ where: { id } });
    if (!post) throw new NotFoundException('Blog post not found');
    return post;
  }

  async create(data: {
    title: string;
    slug: string;
    excerpt: string;
    body: string;
    category: string;
    author_id: string;
    tags?: string[];
    is_published?: boolean;
    published_at?: string | null;
    is_featured?: boolean;
    meta_title?: string;
    meta_desc?: string;
    cover_image?: string;
    og_image?: string;
  }) {
    const post = await this.prisma.blogPost.create({
      data: {
        ...data,
        tags: data.tags ?? [],
        published_at: data.published_at ? new Date(data.published_at) : null,
      },
    });
    await this.invalidateCache();
    return post;
  }

  async update(
    id: string,
    data: {
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
    const post = await this.prisma.blogPost.findUnique({ where: { id } });
    if (!post) throw new NotFoundException('Blog post not found');

    const updated = await this.prisma.blogPost.update({
      where: { id },
      data: {
        ...data,
        published_at:
          data.published_at === undefined
            ? undefined
            : data.published_at
              ? new Date(data.published_at)
              : null,
      },
    });
    await this.invalidateCache();
    return updated;
  }

  async delete(id: string) {
    const post = await this.prisma.blogPost.findUnique({ where: { id } });
    if (!post) throw new NotFoundException('Blog post not found');

    await this.prisma.blogPost.delete({ where: { id } });
    await this.invalidateCache();
    return { deleted: true };
  }

  // ─── Cache helpers ─────────────────────────────────────────────────

  private async invalidateCache() {
    const keys = await this.redis.keys('blog:*');
    if (keys.length > 0) {
      await this.redis.del(...keys);
    }
  }
}
