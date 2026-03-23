import type { BrandConfig } from '@mymanager/config';

export interface PageMeta {
  title?: string;
  description?: string;
  path?: string;
  ogImage?: string;
  noIndex?: boolean;
}

export function buildMetadata(brand: BrandConfig, page?: PageMeta) {
  const title = page?.title
    ? `${page.title}${brand.seo.title_suffix}`
    : brand.seo.default_title;
  const description = page?.description ?? brand.seo.default_description;
  const url = page?.path
    ? `${brand.contact.website_url}${page.path}`
    : brand.contact.website_url;
  const ogImage = page?.ogImage ?? brand.seo.og_image_url;

  return {
    title,
    description,
    metadataBase: new URL(brand.contact.website_url),
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      siteName: brand.identity.app_name,
      images: [{ url: ogImage, width: 1200, height: 630, alt: title }],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image' as const,
      title,
      description,
      images: [ogImage],
      site: brand.seo.twitter_site,
    },
    robots: page?.noIndex ? { index: false, follow: false } : { index: true, follow: true },
  };
}
