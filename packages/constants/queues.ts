export const PLATFORM_QUEUES = {
  facebook: 'publishing-facebook',
  instagram: 'publishing-instagram',
  x: 'publishing-x',
  linkedin: 'publishing-linkedin',
  tiktok: 'publishing-tiktok',
  google_business: 'publishing-google-business',
  pinterest: 'publishing-pinterest',
  youtube: 'publishing-youtube',
  whatsapp: 'publishing-whatsapp',
  threads: 'publishing-threads',
} as const;

export const PLATFORM_QUEUES_DLQ = Object.fromEntries(
  Object.entries(PLATFORM_QUEUES).map(([k, v]) => [k, `${v}-dlq`]),
) as Record<keyof typeof PLATFORM_QUEUES, string>;

export const ALL_QUEUES = [
  ...Object.values(PLATFORM_QUEUES),
  'analytics-sync',
  'email-delivery',
  'token-refresh',
  'report-generation',
  'media-processing',
] as const;
