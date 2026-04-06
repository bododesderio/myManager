import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/services/apiClient';
import { useAuthStore } from '@/store/authStore';

interface ProfileUpdate {
  name?: string;
  email?: string;
  avatarUrl?: string;
}

interface NotificationPrefs {
  postPublished?: boolean;
  postFailed?: boolean;
  approvalRequired?: boolean;
  comments?: boolean;
  messages?: boolean;
  teamActivity?: boolean;
  weeklyReport?: boolean;
  emailDigest?: boolean;
}

interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  const setAuth = useAuthStore((s) => s.setAuth);
  const token = useAuthStore((s) => s.token);

  return useMutation({
    mutationFn: async (data: ProfileUpdate) => {
      const response = await apiClient.put<{ user: { id: string; email: string; name: string; avatarUrl?: string } }>(
        '/v1/users/profile',
        data
      );
      return response;
    },
    onSuccess: (response) => {
      if (response.user && token) {
        setAuth(response.user, token);
      }
      queryClient.invalidateQueries({ queryKey: ['user'] });
    },
  });
}

export function useUpdateNotificationPrefs() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (prefs: NotificationPrefs) => {
      const response = await apiClient.put('/v1/users/preferences', {
        notifications: prefs,
      });
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user', 'preferences'] });
    },
  });
}

export function useChangePassword() {
  return useMutation({
    mutationFn: async (data: ChangePasswordPayload) => {
      const response = await apiClient.post('/v1/auth/change-password', data);
      return response;
    },
  });
}
