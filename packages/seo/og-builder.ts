import type { BrandConfig } from '@mymanager/config';

export interface OgTags {
  'og:title': string;
  'og:description': string;
  'og:image': string;
  'og:url': string;
  'og:site_name': string;
  'og:type': string;
  'twitter:card': string;
  'twitter:title': string;
  'twitter:description': string;
  'twitter:image': string;
  'twitter:site': string;
}

export function buildOgTags(
  brand: BrandConfig,
  options?: {
    title?: string;
    description?: string;
    image?: string;
    url?: string;
    type?: string;
  },
): OgTags {
  const title = options?.title ?? brand.seo.default_title;
  const description = options?.description ?? brand.seo.default_description;
  const image = options?.image ?? brand.seo.og_image_url;
  const url = options?.url ?? brand.contact.website_url;

  return {
    'og:title': title,
    'og:description': description,
    'og:image': image,
    'og:url': url,
    'og:site_name': brand.identity.app_name,
    'og:type': options?.type ?? 'website',
    'twitter:card': 'summary_large_image',
    'twitter:title': title,
    'twitter:description': description,
    'twitter:image': image,
    'twitter:site': brand.seo.twitter_site,
  };
}
