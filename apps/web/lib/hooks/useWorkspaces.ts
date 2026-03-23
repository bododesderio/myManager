'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { useWorkspaceStore } from '@/lib/stores/workspace.store';
import { useEffect } from 'react';

export const workspaceKeys = {
  all: ['workspaces'] as const,
  list: () => [...workspaceKeys.all, 'list'] as const,
  detail: (id: string) => [...workspaceKeys.all, 'detail', id] as const,
  members: (id: string) => [...workspaceKeys.all, 'members', id] as const,
  approvalConfig: (id: string) => [...workspaceKeys.all, 'approval-config', id] as const,
};

export function useWorkspaces() {
  const setWorkspaces = useWorkspaceStore((s) => s.setWorkspaces);
  const query = useQuery({
    queryKey: workspaceKeys.list(),
    queryFn: () => apiClient.get('/workspaces'),
  });

  useEffect(() => {
    if (query.data) {
      setWorkspaces(query.data as any[]);
    }
  }, [query.data, setWorkspaces]);

  return query;
}

export function useWorkspace(id: string | null) {
  return useQuery({
    queryKey: workspaceKeys.detail(id!),
    queryFn: () => apiClient.get(`/workspaces/${id}`),
    enabled: !!id,
  });
}

export function useWorkspaceMembers(workspaceId: string | null) {
  return useQuery({
    queryKey: workspaceKeys.members(workspaceId!),
    queryFn: () => apiClient.get(`/workspaces/${workspaceId}/members`),
    enabled: !!workspaceId,
  });
}

export function useCreateWorkspace() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { name: string; slug?: string }) =>
      apiClient.post('/workspaces', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: workspaceKeys.list() });
    },
  });
}

export function useUpdateWorkspace() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string; name?: string; slug?: string; avatar_url?: string }) =>
      apiClient.put(`/workspaces/${id}`, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: workspaceKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: workspaceKeys.list() });
    },
  });
}

export function useDeleteWorkspace() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.delete(`/workspaces/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: workspaceKeys.list() });
    },
  });
}

export function useInviteMember() {
  const queryClient = useQueryClient();
  const workspaceId = useWorkspaceStore((s) => s.activeWorkspaceId);
  return useMutation({
    mutationFn: (data: { email: string; role: string }) =>
      apiClient.post(`/workspaces/${workspaceId}/members/invite`, data),
    onSuccess: () => {
      if (workspaceId) {
        queryClient.invalidateQueries({ queryKey: workspaceKeys.members(workspaceId) });
      }
    },
  });
}

export function useUpdateMemberRole() {
  const queryClient = useQueryClient();
  const workspaceId = useWorkspaceStore((s) => s.activeWorkspaceId);
  return useMutation({
    mutationFn: ({ memberId, role }: { memberId: string; role: string }) =>
      apiClient.put(`/workspaces/${workspaceId}/members/${memberId}/role`, { role }),
    onSuccess: () => {
      if (workspaceId) {
        queryClient.invalidateQueries({ queryKey: workspaceKeys.members(workspaceId) });
      }
    },
  });
}

export function useRemoveMember() {
  const queryClient = useQueryClient();
  const workspaceId = useWorkspaceStore((s) => s.activeWorkspaceId);
  return useMutation({
    mutationFn: (memberId: string) =>
      apiClient.delete(`/workspaces/${workspaceId}/members/${memberId}`),
    onSuccess: () => {
      if (workspaceId) {
        queryClient.invalidateQueries({ queryKey: workspaceKeys.members(workspaceId) });
      }
    },
  });
}

export function useApprovalConfig(workspaceId: string | null) {
  return useQuery({
    queryKey: workspaceKeys.approvalConfig(workspaceId!),
    queryFn: () => apiClient.get(`/workspaces/${workspaceId}/approval-config`),
    enabled: !!workspaceId,
  });
}

export function useUpdateApprovalConfig() {
  const queryClient = useQueryClient();
  const workspaceId = useWorkspaceStore((s) => s.activeWorkspaceId);
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      apiClient.put(`/workspaces/${workspaceId}/approval-config`, data),
    onSuccess: () => {
      if (workspaceId) {
        queryClient.invalidateQueries({ queryKey: workspaceKeys.approvalConfig(workspaceId) });
      }
    },
  });
}
