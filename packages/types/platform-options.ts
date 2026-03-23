export interface TikTokPostOptions {
  privacy: 'PUBLIC' | 'FRIENDS' | 'PRIVATE';
  allow_comments: boolean;
  allow_duet: boolean;
  allow_stitch: boolean;
  brand_content_toggle: boolean;
  brand_organic_toggle: boolean;
}

export interface GoogleBusinessPostOptions {
  post_type: 'UPDATE' | 'EVENT' | 'OFFER' | 'PRODUCT';
  event_title?: string;
  event_start?: string;
  event_end?: string;
  offer_coupon_code?: string;
  offer_redeem_url?: string;
  offer_terms?: string;
  product_name?: string;
  product_price?: string;
  product_url?: string;
}

export interface YouTubePostOptions {
  title: string;
  description?: string;
  category_id: number;
  tags: string[];
  privacy: 'public' | 'unlisted' | 'private';
  made_for_kids: boolean;
  playlist_id?: string;
}

export interface PinterestPostOptions {
  board_id: string;
  section_id?: string;
  link_url?: string;
  alt_text?: string;
  product_price?: string;
  product_availability?: 'in_stock' | 'out_of_stock' | 'preorder';
}

export interface WhatsAppPostOptions {
  recipient_list_id: string;
  message_type: 'text' | 'image' | 'video' | 'document';
  header_text?: string;
  footer_text?: string;
  buttons?: WhatsAppButton[];
}

export interface WhatsAppButton {
  type: 'url' | 'phone' | 'quick_reply';
  text: string;
  value: string;
}

export type PlatformPostOptions = {
  tiktok?: TikTokPostOptions;
  google_business?: GoogleBusinessPostOptions;
  youtube?: YouTubePostOptions;
  pinterest?: PinterestPostOptions;
  whatsapp?: WhatsAppPostOptions;
};
