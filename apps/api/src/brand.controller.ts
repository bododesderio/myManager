import { Controller, Get } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { Public } from './common/decorators/public.decorator';

@Controller('api')
export class BrandController {
  constructor(private readonly prisma: PrismaService) {}

  @Public()
  @Get('brand')
  async getBrand() {
    const brand = await this.prisma.brandConfig.findFirst({
      orderBy: { created_at: 'desc' },
    });
    if (brand) return brand.config;
    // Return defaults if no brand config in DB
    return {
      identity: {
        app_name: 'MyManager',
        app_tagline: 'Post once. Reach everywhere.',
        app_description: 'The all-in-one social media management platform.',
        logo_url: '',
        logo_dark_url: '',
        favicon_url: '',
        icon_512_url: '',
      },
      theme: {
        primary_color: '#7F77DD',
        primary_dark: '#5B54A6',
        accent_color: '#1D9E75',
        font_heading: 'Inter',
        font_body: 'Inter',
        border_radius: '0.5rem',
      },
      contact: {
        support_email: 'support@mymanager.com',
        sales_email: 'sales@mymanager.com',
        website_url: 'https://mymanager.com',
        twitter_handle: '@mymanager',
        company_name: 'MyManager Ltd',
        company_address: 'Kampala, Uganda',
      },
      legal: {
        copyright_owner: 'MyManager Ltd',
        copyright_year_start: 2025,
        privacy_policy_url: '/legal/privacy',
        terms_url: '/legal/terms',
      },
      seo: {
        default_title: 'MyManager',
        title_suffix: ' | MyManager',
        default_description: 'Post once, reach everywhere.',
        og_image_url: '',
        twitter_site: '@mymanager',
        google_analytics_id: '',
        google_tag_manager: '',
      },
      features: {
        show_blog: true,
        show_affiliate: false,
        maintenance_mode: false,
        registration_open: true,
      },
    };
  }
}
