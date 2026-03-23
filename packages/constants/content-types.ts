export const CONTENT_TYPES = {
  text_only: { slug: 'text_only', displayName: 'Text Only', requiresMedia: false },
  image_single: { slug: 'image_single', displayName: 'Single Image', requiresMedia: true },
  image_carousel: { slug: 'image_carousel', displayName: 'Image Carousel', requiresMedia: true },
  video_short: { slug: 'video_short', displayName: 'Short Video', requiresMedia: true },
  video_long: { slug: 'video_long', displayName: 'Long Video', requiresMedia: true },
  video_story: { slug: 'video_story', displayName: 'Video Story', requiresMedia: true },
  image_story: { slug: 'image_story', displayName: 'Image Story', requiresMedia: true },
  document: { slug: 'document', displayName: 'Document', requiresMedia: true },
  gbp_update: { slug: 'gbp_update', displayName: 'GBP Update', requiresMedia: false },
  gbp_event: { slug: 'gbp_event', displayName: 'GBP Event', requiresMedia: false },
  gbp_offer: { slug: 'gbp_offer', displayName: 'GBP Offer', requiresMedia: false },
  gbp_product: { slug: 'gbp_product', displayName: 'GBP Product', requiresMedia: false },
  pin_image: { slug: 'pin_image', displayName: 'Image Pin', requiresMedia: true },
  pin_video: { slug: 'pin_video', displayName: 'Video Pin', requiresMedia: true },
  pin_product: { slug: 'pin_product', displayName: 'Product Pin', requiresMedia: true },
  pin_idea: { slug: 'pin_idea', displayName: 'Idea Pin', requiresMedia: true },
  whatsapp_broadcast: { slug: 'whatsapp_broadcast', displayName: 'WhatsApp Broadcast', requiresMedia: false },
  whatsapp_channel: { slug: 'whatsapp_channel', displayName: 'WhatsApp Channel Post', requiresMedia: false },
} as const;

export type ContentTypeSlug = keyof typeof CONTENT_TYPES;
