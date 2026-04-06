import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/services/apiClient';
import { useAuthStore } from '@/store/authStore';

export interface MediaItem {
  id: string;
  type: 'image' | 'video';
  uri: string;
  filename: string;
  size: number;
  createdAt: string;
}

export function useMedia(workspaceId: string) {
  return useQuery<MediaItem[]>({
    queryKey: ['media', workspaceId],
    queryFn: async () => {
      const response = await apiClient.get<{ media: MediaItem[] }>(
        `/media`,
        { params: workspaceId ? { workspace_id: workspaceId } : undefined }
      );
      return response.media ?? [];
    },
    enabled: !!workspaceId,
  });
}

const BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001/api';

export function useUploadMedia() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      uri,
      filename,
      mimeType,
      workspaceId,
    }: {
      uri: string;
      filename: string;
      mimeType: string;
      workspaceId: string;
    }) => {
      const token = useAuthStore.getState().token;
      const formData = new FormData();

      formData.append('file', {
        uri,
        name: filename,
        type: mimeType,
      } as unknown as Blob);
      formData.append('workspace_id', workspaceId);

      const response = await fetch(`${BASE_URL}/media/upload`, {
        method: 'POST',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Upload failed' }));
        throw new Error(error.message || `HTTP ${response.status}`);
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['media'] });
    },
  });
}

export function useDeleteMedia() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (mediaId: string) => {
      await apiClient.delete(`/media/${mediaId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['media'] });
    },
  });
}
