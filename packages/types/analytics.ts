export interface PostAnalytics {
  id: string;
  post_id: string;
  platform: string;
  reach: number;
  impressions: number;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
  clicks: number;
  views: number;
  play_duration_seconds: number;
  avg_view_percentage: number;
  engagement_rate: number;
  synced_at: string;
}

export interface WorkspaceAnalyticsDaily {
  id: string;
  workspace_id: string;
  platform: string;
  date: string;
  posts_count: number;
  total_reach: number;
  total_impressions: number;
  total_engagements: number;
  follower_count: number;
  engagement_rate: number;
}

export interface BestTime {
  id: string;
  workspace_id: string;
  platform: string;
  day_of_week: number;
  hour: number;
  score: number;
  sample_size: number;
  calculated_at: string;
}

export interface HashtagSet {
  id: string;
  workspace_id: string;
  name: string;
  hashtags: string[];
  created_at: string;
}
