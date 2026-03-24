'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';

export const adminKeys = {
  users: (filters?: Record<string, unknown>) => ['admin', 'users', filters] as const,
  user: (id: string) => ['admin', 'user', id] as const,
  workspaces: () => ['admin', 'workspaces'] as const,
  plans: () => ['admin', 'plans'] as const,
  plan: (id: string) => ['admin', 'plan', id] as const,
  billing: () => ['admin', 'billing'] as const,
  overrides: () => ['admin', 'overrides'] as const,
  leads: () => ['admin', 'leads'] as const,
  queue: () => ['admin', 'queue'] as const,
  health: () => ['admin', 'health'] as const,
};

export function useAdminUsers(filters: { page?: number; search?: string } = {}) {
  return useQuery({
    queryKey: adminKeys.users(filters),
    queryFn: () => apiClient.get('/users/admin/list', { params: filters }),
  });
}

export function useAdminUser(id: string) {
  return useQuery({
    queryKey: adminKeys.user(id),
    queryFn: () => apiClient.get(`/users/admin/${id}`),
    enabled: !!id,
  });
}

export function useAdminWorkspaces() {
  return useQuery({
    queryKey: adminKeys.workspaces(),
    queryFn: () => apiClient.get('/admin/workspaces'),
  });
}

export function useAdminPlans() {
  return useQuery({
    queryKey: adminKeys.plans(),
    queryFn: () => apiClient.get('/plans'),
  });
}

export function useAdminPlan(id: string) {
  return useQuery({
    queryKey: adminKeys.plan(id),
    queryFn: () => apiClient.get(`/plans/${id}`),
    enabled: !!id,
  });
}

export function useCreatePlan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => apiClient.post('/plans', data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin', 'plans'] }); },
  });
}

export function useUpdatePlan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string } & Record<string, unknown>) =>
      apiClient.put(`/plans/${id}`, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin', 'plans'] }); },
  });
}

export function useAdminBilling() {
  return useQuery({
    queryKey: adminKeys.billing(),
    queryFn: () => apiClient.get('/admin/billing'),
  });
}

export function useAdminOverrides() {
  return useQuery({
    queryKey: adminKeys.overrides(),
    queryFn: () => apiClient.get('/admin/billing/overrides'),
  });
}

export function useCreateOverride() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      apiClient.post('/admin/billing/overrides', data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin', 'overrides'] }); },
  });
}

export function useAdminLeads() {
  return useQuery({
    queryKey: adminKeys.leads(),
    queryFn: () => apiClient.get('/admin/sales-leads'),
  });
}

export function useAdminQueue() {
  return useQuery({
    queryKey: adminKeys.queue(),
    queryFn: async () => {
      const data = await apiClient.get('/admin/queue/stats');
      const queuesObj = (data as any)?.queues ?? {};
      const queues = Object.entries(queuesObj).map(([name, stats]: [string, any]) => ({
        name,
        waiting: stats?.waiting ?? 0,
        active: stats?.active ?? 0,
        completed: stats?.completed ?? 0,
        failed: stats?.failed ?? 0,
      }));

      return {
        queues,
        activeJobs: [],
      };
    },
    refetchInterval: 10_000,
  });
}

export function useAdminHealth() {
  return useQuery({
    queryKey: adminKeys.health(),
    queryFn: async () => {
      const data = await apiClient.get('/admin/api-health');
      const checks = (data as any)?.checks ?? {};
      return {
        status: (data as any)?.status ?? 'unknown',
        uptime: '--',
        responseTime: '--',
        services: Object.entries(checks).map(([name, value]: [string, any]) => ({
          name,
          status: value?.status ?? 'unknown',
          latency: value?.latencyMs != null ? `${value.latencyMs}ms` : '--',
          lastCheck: new Date().toLocaleTimeString(),
        })),
      };
    },
    refetchInterval: 30_000,
  });
}

export function useSuspendUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, suspended }: { id: string; suspended: boolean }) =>
      apiClient.put(`/users/admin/${id}/suspend`, { suspended }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      queryClient.invalidateQueries({ queryKey: adminKeys.user(variables.id) });
    },
  });
}

export function useUpdateUserRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, is_superadmin }: { id: string; is_superadmin: boolean }) =>
      apiClient.put(`/users/admin/${id}/role`, { is_superadmin }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      queryClient.invalidateQueries({ queryKey: adminKeys.user(variables.id) });
    },
  });
}

export function useDisableUserTwoFactor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id }: { id: string }) => apiClient.put(`/users/admin/${id}/2fa/disable`),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      queryClient.invalidateQueries({ queryKey: adminKeys.user(variables.id) });
    },
  });
}
