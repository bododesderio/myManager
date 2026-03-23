'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';

export const notifPrefKeys = {
  all: ['notification-preferences'] as const,
};

export function useNotificationPreferences() {
  return useQuery({
    queryKey: notifPrefKeys.all,
    queryFn: () => apiClient.get('/notifications/preferences'),
  });
}

export function useUpdateNotificationPreferences() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, Record<string, boolean>>) =>
      apiClient.put('/notifications/preferences', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notifPrefKeys.all });
    },
  });
}
