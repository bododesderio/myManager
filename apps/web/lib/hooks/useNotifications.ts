'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { apiClient } from '@/lib/api/client';
import { useSocket } from '@/lib/socket/useSocket';

export const notificationKeys = {
  all: ['notifications'] as const,
  list: (page?: number) => [...notificationKeys.all, 'list', page] as const,
  unreadCount: () => [...notificationKeys.all, 'unread-count'] as const,
};

export function useNotifications(page = 1) {
  return useQuery({
    queryKey: notificationKeys.list(page),
    queryFn: () => apiClient.get('/notifications', { params: { page, per_page: 20 } }),
  });
}

export function useUnreadNotificationCount() {
  const queryClient = useQueryClient();
  const { on } = useSocket();

  const query = useQuery({
    queryKey: notificationKeys.unreadCount(),
    queryFn: () => apiClient.get('/notifications/unread-count'),
    refetchInterval: 60_000, // Poll every 60s as fallback
  });

  // Real-time update when socket event received
  useEffect(() => {
    const cleanup = on('notification:new', () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    });
    return cleanup;
  }, [on, queryClient]);

  return query;
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.put(`/notifications/${id}/read`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    },
  });
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => apiClient.put('/notifications/read-all'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    },
  });
}
