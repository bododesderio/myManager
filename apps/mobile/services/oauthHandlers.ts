import * as Linking from 'expo-linking';
import { apiClient } from './apiClient';

export type OAuthProvider = 'facebook' | 'instagram' | 'twitter' | 'linkedin' | 'tiktok' | 'pinterest' | 'youtube';

interface OAuthResult {
  success: boolean;
  accountId?: string;
  accountName?: string;
  error?: string;
}

const REDIRECT_URI = Linking.createURL('oauth/callback');

export async function initiateOAuth(provider: OAuthProvider, workspaceId: string): Promise<string> {
  const response = await apiClient.post<{ authUrl: string }>(`/social-accounts/connect/${provider}`, {
    workspaceId,
    redirectUri: REDIRECT_URI,
  });
  return response.authUrl;
}

export async function handleOAuthCallback(
  provider: OAuthProvider,
  code: string,
  state: string,
  workspaceId: string,
): Promise<OAuthResult> {
  try {
    const response = await apiClient.post<{
      accountId: string;
      accountName: string;
    }>(`/social-accounts/callback/${provider}`, {
      code,
      state,
      workspaceId,
    });

    return {
      success: true,
      accountId: response.accountId,
      accountName: response.accountName,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'OAuth failed',
    };
  }
}

export async function disconnectAccount(accountId: string): Promise<void> {
  await apiClient.delete(`/social-accounts/${accountId}`);
}

export async function refreshAccountToken(accountId: string): Promise<void> {
  await apiClient.post(`/social-accounts/${accountId}/refresh-token`);
}

export async function listSocialAccounts<T = unknown>(workspaceId: string): Promise<T> {
  return apiClient.get<T>('/social-accounts', { params: { workspaceId } });
}
