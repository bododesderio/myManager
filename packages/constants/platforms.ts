export const PLATFORMS = {
  facebook: { slug: 'facebook', displayName: 'Facebook', phase: 'launch', apiVersion: 'Graph API v21' },
  instagram: { slug: 'instagram', displayName: 'Instagram', phase: 'launch', apiVersion: 'Graph API v21' },
  x: { slug: 'x', displayName: 'X / Twitter', phase: 'launch', apiVersion: 'API v2' },
  linkedin: { slug: 'linkedin', displayName: 'LinkedIn', phase: 'launch', apiVersion: 'UGC Posts API v2' },
  tiktok: { slug: 'tiktok', displayName: 'TikTok', phase: 'launch', apiVersion: 'Content Posting API' },
  google_business: { slug: 'google_business', displayName: 'Google Business Profile', phase: 'launch', apiVersion: 'My Business API v4.9' },
  pinterest: { slug: 'pinterest', displayName: 'Pinterest', phase: 'phase2', apiVersion: 'API v5' },
  youtube: { slug: 'youtube', displayName: 'YouTube', phase: 'phase2', apiVersion: 'Data API v3' },
  whatsapp: { slug: 'whatsapp', displayName: 'WhatsApp Business', phase: 'phase2', apiVersion: 'Business Cloud API' },
  threads: { slug: 'threads', displayName: 'Threads', phase: 'phase2', apiVersion: 'Threads API' },
} as const;

export type PlatformSlug = keyof typeof PLATFORMS;
export const PLATFORM_SLUGS = Object.keys(PLATFORMS) as PlatformSlug[];
