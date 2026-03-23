import { z } from 'zod';

export const createPostSchema = z.object({
  caption: z.string().min(1).max(65000),
  content_type: z.enum([
    'text_only', 'image_single', 'image_carousel', 'video_short', 'video_long',
    'video_story', 'image_story', 'document', 'gbp_update', 'gbp_event', 'gbp_offer',
    'gbp_product', 'pin_image', 'pin_video', 'pin_product', 'pin_idea',
    'whatsapp_broadcast', 'whatsapp_channel',
  ]),
  platforms: z.array(z.enum([
    'facebook', 'instagram', 'x', 'linkedin', 'tiktok',
    'google_business', 'pinterest', 'youtube', 'whatsapp', 'threads',
  ])).min(1),
  scheduled_at: z.string().datetime().nullable().optional(),
  link_url: z.string().url().nullable().optional(),
  link_preview_override: z.object({
    title: z.string().max(200).optional(),
    description: z.string().max(500).optional(),
    image_url: z.string().url().optional(),
  }).nullable().optional(),
  first_comment_text: z.string().max(2200).nullable().optional(),
  platform_options: z.record(z.unknown()).optional(),
  media_ids: z.array(z.string().uuid()).optional(),
  campaign_id: z.string().uuid().nullable().optional(),
  project_id: z.string().uuid().nullable().optional(),
});

export const updatePostSchema = createPostSchema.partial();

export type CreatePostInput = z.infer<typeof createPostSchema>;
export type UpdatePostInput = z.infer<typeof updatePostSchema>;
