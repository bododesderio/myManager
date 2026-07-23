'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';

export interface Platform {
  id: string;
  slug: string;
  name: string;
  max_caption_chars: number;
  max_images: number;
  max_video_duration: number;
  max_file_size_mb: number;
  supports_scheduling: boolean;
  supports_analytics: boolean;
  supports_inbox: boolean;
}

export const platformKeys = {
  all: ['platforms'] as const,
};

export function usePlatforms() {
  return useQuery<Platform[]>({
    queryKey: platformKeys.all,
    queryFn: () => apiClient.get('/platforms'),
    staleTime: 5 * 60 * 1000, // platforms rarely change, cache 5 min
  });
}

/**
 * Slugs (hyphenated form, e.g. `google-business`) whose OAuth credentials are
 * set server-side — i.e. platforms that can actually be connected right now.
 * Everything else is surfaced as "coming soon".
 */
export function useConfiguredPlatforms(workspaceId: string | null) {
  return useQuery<string[]>({
    queryKey: [...platformKeys.all, 'configured', workspaceId],
    enabled: Boolean(workspaceId),
    queryFn: async () => {
      const res = await apiClient.get<{ configured: string[] }>(
        `/social-accounts/platforms/configured?workspaceId=${workspaceId}`,
      );
      return res.configured ?? [];
    },
    staleTime: 5 * 60 * 1000,
  });
}

/** Normalize a public platform slug to the configured-slug form. */
export function normalizePlatformSlug(slug: string): string {
  return slug.toLowerCase().replace(/_/g, '-');
}
