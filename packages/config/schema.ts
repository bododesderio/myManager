import { z } from 'zod';

export const brandIdentitySchema = z.object({
  app_name: z.string().min(1).max(100),
  app_tagline: z.string().max(200),
  app_description: z.string().max(1000),
  logo_url: z.string().url(),
  logo_dark_url: z.string().url(),
  favicon_url: z.string().url(),
  icon_512_url: z.string().url(),
});

export const brandThemeSchema = z.object({
  primary_color: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  primary_dark: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  accent_color: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  font_heading: z.string().min(1),
  font_body: z.string().min(1),
  border_radius: z.string(),
});

export const brandContactSchema = z.object({
  support_email: z.string().email(),
  sales_email: z.string().email(),
  website_url: z.string().url(),
  twitter_handle: z.string(),
  company_name: z.string().min(1),
  company_address: z.string(),
});

export const brandLegalSchema = z.object({
  copyright_owner: z.string().min(1),
  copyright_year_start: z.number().int().min(2020),
  privacy_policy_url: z.string().url(),
  terms_url: z.string().url(),
});

export const brandSeoSchema = z.object({
  default_title: z.string().min(1).max(60),
  title_suffix: z.string().max(30),
  default_description: z.string().max(160),
  og_image_url: z.string().url(),
  twitter_site: z.string(),
  google_analytics_id: z.string(),
  google_tag_manager: z.string(),
});

export const brandFeaturesSchema = z.object({
  show_blog: z.boolean(),
  show_affiliate: z.boolean(),
  maintenance_mode: z.boolean(),
  registration_open: z.boolean(),
});

export const brandConfigSchema = z.object({
  identity: brandIdentitySchema,
  theme: brandThemeSchema,
  contact: brandContactSchema,
  legal: brandLegalSchema,
  seo: brandSeoSchema,
  features: brandFeaturesSchema,
});

export type BrandConfig = z.infer<typeof brandConfigSchema>;
