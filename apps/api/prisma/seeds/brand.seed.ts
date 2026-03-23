import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const defaultBrandConfig = {
  identity: {
    app_name: 'MyManager',
    app_tagline: 'Post once. Reach everywhere.',
    app_description: 'The all-in-one social media management platform for creators, brands, and agencies.',
    logo_url: '/logo.svg',
    logo_dark_url: '/logo-dark.svg',
    favicon_url: '/favicon.ico',
    icon_512_url: '/icon-512.png',
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
    default_title: 'MyManager — Social Media Management Platform',
    title_suffix: ' | MyManager',
    default_description: 'Post once, reach everywhere. Schedule, publish, and analyse social media content across 10 platforms from a single interface.',
    og_image_url: '/og-image.png',
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

async function seedBrand() {
  const existing = await prisma.brandConfig.findFirst();
  const explicitFields = {
    app_name: defaultBrandConfig.identity.app_name,
    app_tagline: defaultBrandConfig.identity.app_tagline,
    logo_url: defaultBrandConfig.identity.logo_url,
    favicon_url: defaultBrandConfig.identity.favicon_url,
    support_email: defaultBrandConfig.contact.support_email,
    sales_email: defaultBrandConfig.contact.sales_email,
    footer_made_in: `Made with care in ${defaultBrandConfig.contact.company_address}`,
    footer_copyright: `\u00A9 ${defaultBrandConfig.legal.copyright_year_start}\u2013${new Date().getFullYear()} ${defaultBrandConfig.legal.copyright_owner}. All rights reserved.`,
    meta_title_suffix: defaultBrandConfig.seo.title_suffix,
    google_analytics_id: defaultBrandConfig.seo.google_analytics_id || null,
    maintenance_mode: defaultBrandConfig.features.maintenance_mode,
    social_twitter: defaultBrandConfig.contact.twitter_handle,
  };

  if (existing) {
    await prisma.brandConfig.update({
      where: { id: existing.id },
      data: { ...explicitFields, config: defaultBrandConfig },
    });
  } else {
    await prisma.brandConfig.create({
      data: { ...explicitFields, config: defaultBrandConfig },
    });
  }
  console.log('Seeded platform brand config');
}

seedBrand()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
