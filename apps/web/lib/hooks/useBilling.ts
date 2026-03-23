'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { useWorkspaceStore } from '@/lib/stores/workspace.store';

export const billingKeys = {
  subscription: (workspaceId: string) => ['billing', 'subscription', workspaceId] as const,
  history: (workspaceId: string) => ['billing', 'history', workspaceId] as const,
  plans: ['billing', 'plans'] as const,
};

export function useSubscription() {
  const workspaceId = useWorkspaceStore((s) => s.activeWorkspaceId);
  return useQuery({
    queryKey: billingKeys.subscription(workspaceId!),
    queryFn: () => apiClient.get('/billing/subscription', { params: { workspaceId } }),
    enabled: !!workspaceId,
  });
}

export function usePlans() {
  return useQuery({
    queryKey: billingKeys.plans,
    queryFn: () => apiClient.get('/plans'),
  });
}

export function useBillingHistory() {
  const workspaceId = useWorkspaceStore((s) => s.activeWorkspaceId);
  return useQuery({
    queryKey: billingKeys.history(workspaceId!),
    queryFn: () => apiClient.get('/billing/history', { params: { workspaceId } }),
    enabled: !!workspaceId,
  });
}

export function useSubscribe() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { planId: string; interval: 'monthly' | 'annual' }) =>
      apiClient.post('/billing/subscribe', data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['billing'] }); },
  });
}

export function useChangePlan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { planId: string; interval: 'monthly' | 'annual' }) =>
      apiClient.post('/billing/change-plan', data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['billing'] }); },
  });
}

export function useCancelSubscription() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => apiClient.post('/billing/cancel'),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['billing'] }); },
  });
}
