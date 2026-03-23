export interface User {
  id: string;
  email: string;
  name: string;
  avatar_url: string | null;
  email_verified: boolean;
  is_superadmin: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserPreferences {
  id: string;
  user_id: string;
  language: string;
  currency: string;
  timezone: string;
  theme: 'light' | 'dark' | 'system';
  totp_enabled: boolean;
  lang_source: 'user' | 'detected' | 'default';
}

export interface UserPushToken {
  id: string;
  user_id: string;
  token: string;
  platform: 'ios' | 'android';
  device_name: string | null;
  created_at: string;
}

export type WorkspaceRole = 'owner' | 'admin' | 'member';

export interface WorkspaceMember {
  id: string;
  user_id: string;
  workspace_id: string;
  role: WorkspaceRole;
  user: User;
  joined_at: string;
}
