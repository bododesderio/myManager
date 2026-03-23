export interface Project {
  id: string;
  workspace_id: string;
  name: string;
  slug: string;
  description: string | null;
  client_name: string | null;
  client_email: string | null;
  status: 'active' | 'archived';
  created_at: string;
  updated_at: string;
}

export interface ProjectMember {
  id: string;
  project_id: string;
  user_id: string;
  role: 'manager' | 'contributor';
  assigned_at: string;
}

export interface PortalAccessToken {
  id: string;
  project_id: string;
  token: string;
  label: string;
  expires_at: string | null;
  is_active: boolean;
  created_at: string;
}

export interface PortalAction {
  id: string;
  portal_token_id: string;
  action: string;
  metadata: Record<string, unknown>;
  ip_address: string;
  created_at: string;
}
