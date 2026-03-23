export interface SocialAccount {
  id: string;
  workspace_id: string;
  platform: string;
  platform_user_id: string;
  platform_username: string;
  display_name: string;
  avatar_url: string | null;
  access_token_encrypted: string;
  refresh_token_encrypted: string | null;
  token_expires_at: string | null;
  scopes: string[];
  metadata: Record<string, unknown>;
  is_active: boolean;
  connected_at: string;
  last_used_at: string | null;
}

export interface SocialComment {
  id: string;
  workspace_id: string;
  social_account_id: string;
  platform: string;
  platform_comment_id: string;
  platform_post_id: string;
  author_name: string;
  author_avatar_url: string | null;
  text: string;
  sentiment: 'positive' | 'neutral' | 'negative' | null;
  is_reply: boolean;
  replied_at: string | null;
  fetched_at: string;
}

export interface CommentAssignment {
  id: string;
  social_comment_id: string;
  assigned_to_user_id: string;
  assigned_by_user_id: string;
  status: 'pending' | 'in_progress' | 'done';
  assigned_at: string;
}
