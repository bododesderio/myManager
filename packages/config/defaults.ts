import type { BrandConfig } from './schema';

export const defaultBrandConfig: BrandConfig = {
  identity: {
    app_name: 'MyManager',
    app_tagline: 'Post once. Reach everywhere.',
    app_description: 'The all-in-one social media management platform for creators, brands, and agencies.',
    logo_url: 'https://cdn.mymanager.com/brand/logo.svg',
    logo_dark_url: 'https://cdn.mymanager.com/brand/logo-dark.svg',
    favicon_url: 'https://cdn.mymanager.com/brand/favicon.ico',
    icon_512_url: 'https://cdn.mymanager.com/brand/icon-512.png',
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
    privacy_policy_url: 'https://mymanager.com/legal/privacy',
    terms_url: 'https://mymanager.com/legal/terms',
  },
  seo: {
    default_title: 'MyManager — Social Media Management Platform',
    title_suffix: ' | MyManager',
    default_description: 'Post once, reach everywhere. Schedule, publish, and analyse social media content across 10 platforms from a single interface.',
    og_image_url: 'https://cdn.mymanager.com/brand/og-default.png',
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
