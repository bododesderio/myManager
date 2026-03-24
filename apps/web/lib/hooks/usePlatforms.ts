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
