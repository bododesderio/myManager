import {
  Injectable,
  Logger,
  NotFoundException,
  OnModuleDestroy,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma.service';
import { getSharedRedis } from '../../common/redis/shared-redis';

const CACHE_TTL_1H = 3600; // 1 hour in seconds
const CACHE_TTL_5M = 300; // 5 minutes in seconds

const CACHE_KEY_BRAND = 'cms:brand';
const CACHE_KEY_NAV = 'cms:nav';
const CACHE_KEY_THEME = 'cms:theme';
const CACHE_KEY_PAGE_PREFIX = 'cms:page:';

@Injectable()
export class CmsService implements OnModuleDestroy {
  private readonly logger = new Logger(CmsService.name);
  private readonly redis = getSharedRedis(
    this.config.get<string>('REDIS_URL') || 'redis://localhost:6379',
    this.logger,
  );

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  async onModuleDestroy() {}

  // ───────────────────────────────────────────────
  // Cache helpers
  // ───────────────────────────────────────────────

  private async getFromCache<T>(key: string): Promise<T | null> {
    try {
      const cached = await this.redis.get(key);
      return cached ? (JSON.parse(cached) as T) : null;
    } catch (err) {
      this.logger.warn(`Redis GET failed for key "${key}"`, err);
      return null;
    }
  }

  private async setCache(key: string, data: unknown, ttl: number): Promise<void> {
    try {
      await this.redis.set(key, JSON.stringify(data), 'EX', ttl);
    } catch (err) {
      this.logger.warn(`Redis SET failed for key "${key}"`, err);
    }
  }

  private async invalidateCache(...keys: string[]): Promise<void> {
    try {
      if (keys.length > 0) {
        await this.redis.del(...keys);
      }
    } catch (err) {
      this.logger.warn('Redis DEL failed', err);
    }
  }

  // ───────────────────────────────────────────────
  // Public: Brand
  // ───────────────────────────────────────────────

  async getBrand() {
    const cached = await this.getFromCache(CACHE_KEY_BRAND);
    if (cached) return cached;

    const brand = await this.prisma.brandConfig.findFirst();
    if (!brand) throw new NotFoundException('Brand configuration not found');

    await this.setCache(CACHE_KEY_BRAND, brand, CACHE_TTL_1H);
    return brand;
  }

  // ───────────────────────────────────────────────
  // Public: Theme
  // ───────────────────────────────────────────────

  async getTheme() {
    const cached = await this.getFromCache(CACHE_KEY_THEME);
    if (cached) return cached;

    const theme = await this.prisma.themeConfig.findFirst();
    if (!theme) throw new NotFoundException('Theme configuration not found');

    await this.setCache(CACHE_KEY_THEME, theme, CACHE_TTL_1H);
    return theme;
  }

  // ───────────────────────────────────────────────
  // Public: Navigation
  // ───────────────────────────────────────────────

  async getNav() {
    const cached = await this.getFromCache(CACHE_KEY_NAV);
    if (cached) return cached;

    const links = await this.prisma.navLink.findMany({
      where: { is_visible: true },
      orderBy: { order_index: 'asc' },
    });

    // Group by placement (e.g. "header", "footer", "sidebar")
    const grouped: Record<string, typeof links> = {};
    for (const link of links) {
      if (!grouped[link.placement]) {
        grouped[link.placement] = [];
      }
      grouped[link.placement].push(link);
    }

    await this.setCache(CACHE_KEY_NAV, grouped, CACHE_TTL_1H);
    return grouped;
  }

  // ───────────────────────────────────────────────
  // Public: Stock images (SystemConfig under category="stock_images")
  // ───────────────────────────────────────────────

  async getStockImages(): Promise<Record<string, string>> {
    const cacheKey = 'cms:stock-images';
    const cached = await this.getFromCache(cacheKey);
    if (cached) return cached as Record<string, string>;

    const rows = await this.prisma.systemConfig.findMany({
      where: { category: 'stock_images', is_secret: false },
      select: { key: true, value: true },
    });
    const map: Record<string, string> = {};
    for (const row of rows) {
      map[row.key] = row.value;
    }
    await this.setCache(cacheKey, map, 300);
    return map;
  }

  // ───────────────────────────────────────────────
  // Public: CMS Page (visible sections only)
  // ───────────────────────────────────────────────

  async getPublicPage(slug: string) {
    const cacheKey = `${CACHE_KEY_PAGE_PREFIX}${slug}`;
    const cached = await this.getFromCache(cacheKey);
    if (cached) return cached;

    const page = await this.prisma.cmsPage.findUnique({
      where: { slug },
      include: {
        sections: {
          where: { is_visible: true },
          orderBy: { order_index: 'asc' },
          include: {
            fields: {
              orderBy: { order_index: 'asc' },
            },
          },
        },
      },
    });

    if (!page) throw new NotFoundException(`Page "${slug}" not found`);

    await this.setCache(cacheKey, page, CACHE_TTL_5M);
    return page;
  }

  // ───────────────────────────────────────────────
  // Admin: List pages
  // ───────────────────────────────────────────────

  async listPages() {
    return this.prisma.cmsPage.findMany({
      orderBy: { created_at: 'desc' },
      include: {
        sections: {
          orderBy: { order_index: 'asc' },
          select: {
            id: true,
            section_key: true,
            is_visible: true,
            order_index: true,
          },
        },
      },
    });
  }

  // ───────────────────────────────────────────────
  // Admin: Get page (all sections, including hidden)
  // ───────────────────────────────────────────────

  async getAdminPage(slug: string) {
    const page = await this.prisma.cmsPage.findUnique({
      where: { slug },
      include: {
        sections: {
          orderBy: { order_index: 'asc' },
          include: {
            fields: {
              orderBy: { order_index: 'asc' },
            },
          },
        },
      },
    });

    if (!page) throw new NotFoundException(`Page "${slug}" not found`);
    return page;
  }

  async updatePage(
    slug: string,
    data: {
      title?: string;
      meta_title?: string | null;
      meta_desc?: string | null;
      og_image?: string | null;
      is_published?: boolean;
    },
  ) {
    const page = await this.prisma.cmsPage.update({
      where: { slug },
      data,
    });

    await this.invalidateCache(`${CACHE_KEY_PAGE_PREFIX}${slug}`);
    return page;
  }

  // ───────────────────────────────────────────────
  // Admin: Update field
  // ───────────────────────────────────────────────

  async updateField(id: string, value: string) {
    const field = await this.prisma.cmsField.update({
      where: { id },
      data: { value },
      include: { section: { select: { page: { select: { slug: true } } } } },
    });

    // Invalidate the page cache for the affected page
    const slug = field.section.page.slug;
    await this.invalidateCache(`${CACHE_KEY_PAGE_PREFIX}${slug}`);

    return field;
  }

  // ───────────────────────────────────────────────
  // Admin: Toggle section visibility
  // ───────────────────────────────────────────────

  async toggleSectionVisibility(id: string, isVisible: boolean) {
    const section = await this.prisma.cmsSection.update({
      where: { id },
      data: { is_visible: isVisible },
      include: { page: { select: { slug: true } } },
    });

    // Invalidate the page cache for the affected page
    await this.invalidateCache(`${CACHE_KEY_PAGE_PREFIX}${section.page.slug}`);

    return section;
  }

  // ───────────────────────────────────────────────
  // Admin: Update brand
  // ───────────────────────────────────────────────

  async updateBrand(data: Record<string, unknown>) {
    const existing = await this.prisma.brandConfig.findFirst();
    if (!existing) throw new NotFoundException('Brand configuration not found');

    const brand = await this.prisma.brandConfig.update({
      where: { id: existing.id },
      data,
    });

    await this.invalidateCache(CACHE_KEY_BRAND);
    return brand;
  }

  async updateTheme(data: Record<string, unknown>) {
    const existing = await this.prisma.themeConfig.findFirst();
    if (!existing) throw new NotFoundException('Theme configuration not found');

    const theme = await this.prisma.themeConfig.update({
      where: { id: existing.id },
      data,
    });

    await this.invalidateCache(CACHE_KEY_THEME);
    return theme;
  }

  async listNavLinks() {
    return this.prisma.navLink.findMany({
      orderBy: [{ placement: 'asc' }, { order_index: 'asc' }],
    });
  }

  async createNavLink(data: {
    label: string;
    href: string;
    placement: string;
    order_index?: number;
    is_visible?: boolean;
    is_external?: boolean;
  }) {
    const link = await this.prisma.navLink.create({
      data,
    });

    await this.invalidateCache(CACHE_KEY_NAV);
    return link;
  }

  async updateNavLink(
    id: string,
    data: {
      label?: string;
      href?: string;
      placement?: string;
      order_index?: number;
      is_visible?: boolean;
      is_external?: boolean;
    },
  ) {
    const link = await this.prisma.navLink.update({
      where: { id },
      data,
    });

    await this.invalidateCache(CACHE_KEY_NAV);
    return link;
  }

  async deleteNavLink(id: string) {
    const link = await this.prisma.navLink.delete({
      where: { id },
    });

    await this.invalidateCache(CACHE_KEY_NAV);
    return link;
  }

  // ───────────────────────────────────────────────
  // Admin: Trigger ISR revalidation
  // ───────────────────────────────────────────────

  async triggerRevalidation() {
    const webUrl = this.config.get<string>('WEB_URL');
    if (!webUrl) {
      this.logger.warn('WEB_URL is not configured; skipping revalidation');
      return { revalidated: false, reason: 'WEB_URL not configured' };
    }

    try {
      const response = await fetch(`${webUrl}/api/revalidate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        this.logger.warn(`Revalidation request failed with status ${response.status}`);
        return { revalidated: false, status: response.status };
      }

      const result = (await response.json()) as Record<string, unknown>;
      return { revalidated: true, ...result };
    } catch (err) {
      this.logger.error('Revalidation request failed', err);
      return { revalidated: false, error: (err as Error).message };
    }
  }
}
