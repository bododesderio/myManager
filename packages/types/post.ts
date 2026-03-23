export enum PostStatus {
  DRAFT = 'draft',
  PENDING_APPROVAL = 'pending_approval',
  REVISION_REQUESTED = 'revision_requested',
  APPROVED = 'approved',
  SCHEDULED = 'scheduled',
  PUBLISHING = 'publishing',
  PUBLISHED = 'published',
  PARTIALLY_FAILED = 'partially_failed',
  FAILED = 'failed',
}

export enum ContentType {
  TEXT_ONLY = 'text_only',
  IMAGE_SINGLE = 'image_single',
  IMAGE_CAROUSEL = 'image_carousel',
  VIDEO_SHORT = 'video_short',
  VIDEO_LONG = 'video_long',
  VIDEO_STORY = 'video_story',
  IMAGE_STORY = 'image_story',
  DOCUMENT = 'document',
  GBP_UPDATE = 'gbp_update',
  GBP_EVENT = 'gbp_event',
  GBP_OFFER = 'gbp_offer',
  GBP_PRODUCT = 'gbp_product',
  PIN_IMAGE = 'pin_image',
  PIN_VIDEO = 'pin_video',
  PIN_PRODUCT = 'pin_product',
  PIN_IDEA = 'pin_idea',
  WHATSAPP_BROADCAST = 'whatsapp_broadcast',
  WHATSAPP_CHANNEL = 'whatsapp_channel',
}

export enum Platform {
  FACEBOOK = 'facebook',
  INSTAGRAM = 'instagram',
  X = 'x',
  LINKEDIN = 'linkedin',
  TIKTOK = 'tiktok',
  GOOGLE_BUSINESS = 'google_business',
  PINTEREST = 'pinterest',
  YOUTUBE = 'youtube',
  WHATSAPP = 'whatsapp',
  THREADS = 'threads',
}

export interface Post {
  id: string;
  workspace_id: string;
  project_id: string | null;
  campaign_id: string | null;
  user_id: string;
  caption: string;
  content_type: ContentType;
  platforms: Platform[];
  status: PostStatus;
  scheduled_at: string | null;
  published_at: string | null;
  link_url: string | null;
  link_preview_override: LinkPreviewOverride | null;
  first_comment_text: string | null;
  platform_options: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface LinkPreviewOverride {
  title?: string;
  description?: string;
  image_url?: string;
}

export interface PostPlatformResult {
  id: string;
  post_id: string;
  platform: Platform;
  status: 'pending' | 'publishing' | 'published' | 'failed';
  platform_post_id: string | null;
  platform_post_url: string | null;
  error_message: string | null;
  published_at: string | null;
}

export interface MediaAsset {
  id: string;
  workspace_id: string;
  user_id: string;
  filename: string;
  mime_type: string;
  size_bytes: number;
  width: number | null;
  height: number | null;
  duration_seconds: number | null;
  r2_key: string;
  url: string;
  variants: Record<string, string>;
  created_at: string;
}
