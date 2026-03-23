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

export async function initiateOAuth(provider: OAuthProvider): Promise<string> {
  const response = await apiClient.get<{ authUrl: string }>(`/oauth/${provider}/authorize`, {
    params: { redirectUri: REDIRECT_URI },
  });
  return response.authUrl;
}

export async function handleOAuthCallback(
  provider: OAuthProvider,
  code: string
): Promise<OAuthResult> {
  try {
    const response = await apiClient.post<{
      accountId: string;
      accountName: string;
    }>(`/oauth/${provider}/callback`, {
      code,
      redirectUri: REDIRECT_URI,
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

export async function disconnectAccount(provider: OAuthProvider, accountId: string): Promise<void> {
  await apiClient.delete(`/oauth/${provider}/accounts/${accountId}`);
}

export async function refreshAccountToken(provider: OAuthProvider, accountId: string): Promise<void> {
  await apiClient.post(`/oauth/${provider}/accounts/${accountId}/refresh`);
}
