import type { BrandConfig } from '@mymanager/config';

export function buildOrganizationSchema(brand: BrandConfig) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: brand.contact.company_name,
    url: brand.contact.website_url,
    logo: brand.identity.logo_url,
    description: brand.identity.app_description,
    email: brand.contact.support_email,
    address: {
      '@type': 'PostalAddress',
      streetAddress: brand.contact.company_address,
    },
    sameAs: brand.contact.twitter_handle
      ? [`https://twitter.com/${brand.contact.twitter_handle.replace('@', '')}`]
      : [],
  };
}

export function buildSoftwareApplicationSchema(brand: BrandConfig) {
  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: brand.identity.app_name,
    description: brand.identity.app_description,
    url: brand.contact.website_url,
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web, iOS, Android',
    offers: {
      '@type': 'AggregateOffer',
      lowPrice: '0',
      highPrice: '79',
      priceCurrency: 'USD',
      offerCount: 4,
    },
  };
}

export function buildBlogPostingSchema(
  brand: BrandConfig,
  post: { title: string; description: string; slug: string; publishedAt: string; author: string; imageUrl?: string },
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.description,
    url: `${brand.contact.website_url}/blog/${post.slug}`,
    datePublished: post.publishedAt,
    author: { '@type': 'Person', name: post.author },
    publisher: {
      '@type': 'Organization',
      name: brand.contact.company_name,
      logo: { '@type': 'ImageObject', url: brand.identity.logo_url },
    },
    image: post.imageUrl,
  };
}

export function buildOfferSchema(brand: BrandConfig, plan: { name: string; priceUsd: number; description: string }) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Offer',
    name: `${brand.identity.app_name} ${plan.name}`,
    description: plan.description,
    price: plan.priceUsd.toString(),
    priceCurrency: 'USD',
    url: `${brand.contact.website_url}/pricing`,
    seller: { '@type': 'Organization', name: brand.contact.company_name },
  };
}

export function buildFAQPageSchema(brand: BrandConfig, faqs: Array<{ question: string; answer: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: { '@type': 'Answer', text: faq.answer },
    })),
    publisher: { '@type': 'Organization', name: brand.contact.company_name },
  };
}

export function buildContactPageSchema(brand: BrandConfig) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ContactPage',
    name: `Contact ${brand.identity.app_name}`,
    url: `${brand.contact.website_url}/contact`,
    mainEntity: {
      '@type': 'Organization',
      name: brand.contact.company_name,
      email: brand.contact.support_email,
      url: brand.contact.website_url,
    },
  };
}

export function buildMobileApplicationSchema(brand: BrandConfig) {
  return {
    '@context': 'https://schema.org',
    '@type': 'MobileApplication',
    name: brand.identity.app_name,
    description: brand.identity.app_description,
    operatingSystem: 'iOS, Android',
    applicationCategory: 'BusinessApplication',
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
  };
}
