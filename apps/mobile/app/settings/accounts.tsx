import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Linking } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/services/apiClient';
import { useWorkspaceStore } from '@/store/workspaceStore';
import { initiateOAuth, disconnectAccount, type OAuthProvider } from '@/services/oauthHandlers';

interface SocialAccount {
  id: string;
  platform: string;
  display_name?: string;
  platform_username?: string;
  is_active?: boolean;
}

const SUPPORTED: { id: OAuthProvider; label: string }[] = [
  { id: 'facebook', label: 'Facebook' },
  { id: 'instagram', label: 'Instagram' },
  { id: 'twitter', label: 'X / Twitter' },
  { id: 'linkedin', label: 'LinkedIn' },
  { id: 'tiktok', label: 'TikTok' },
  { id: 'pinterest', label: 'Pinterest' },
  { id: 'youtube', label: 'YouTube' },
];

export default function AccountsSettingsScreen() {
  const workspaceId = useWorkspaceStore((s) => s.currentWorkspace?.id ?? null);

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['social-accounts', workspaceId],
    queryFn: () =>
      apiClient.get<SocialAccount[] | { accounts?: SocialAccount[] }>('/social-accounts', {
        params: { workspaceId: workspaceId! },
      }),
    enabled: !!workspaceId,
  });

  const accounts: SocialAccount[] = (data as any)?.accounts ?? (data as any) ?? [];
  const byPlatform = new Map<string, SocialAccount>();
  for (const a of accounts) byPlatform.set(a.platform.toLowerCase(), a);

  async function handleConnect(provider: OAuthProvider) {
    if (!workspaceId) {
      Alert.alert('No workspace', 'Select a workspace first.');
      return;
    }
    try {
      const authUrl = await initiateOAuth(provider, workspaceId);
      await Linking.openURL(authUrl);
      Alert.alert(
        'Complete in browser',
        'Finish the OAuth flow in your browser, then pull to refresh this screen.',
      );
    } catch (err: any) {
      Alert.alert('Failed', err?.message ?? 'Could not start connection');
    }
  }

  async function handleDisconnect(account: SocialAccount) {
    Alert.alert(`Disconnect ${account.platform}?`, 'Scheduled posts on this account will fail.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Disconnect',
        style: 'destructive',
        onPress: async () => {
          try {
            await disconnectAccount(account.id);
            refetch();
          } catch (err: any) {
            Alert.alert('Failed', err?.message ?? 'Could not disconnect');
          }
        },
      },
    ]);
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Connected Accounts</Text>
        <TouchableOpacity onPress={() => refetch()}>
          <Text style={styles.refreshText}>Refresh</Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color="#7F77DD" />
        </View>
      ) : isError ? (
        <View style={styles.center}>
          <Text style={styles.errorText}>{(error as Error)?.message ?? 'Failed to load'}</Text>
          <TouchableOpacity onPress={() => refetch()}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView style={styles.content}>
          {SUPPORTED.map(({ id, label }) => {
            const account = byPlatform.get(id);
            const connected = !!account?.is_active;
            return (
              <View key={id} style={styles.accountRow}>
                <View style={styles.accountInfo}>
                  <Text style={styles.platformName}>{label}</Text>
                  {connected && account && (
                    <Text style={styles.accountName}>
                      {account.display_name || account.platform_username}
                    </Text>
                  )}
                </View>
                <TouchableOpacity
                  style={[styles.connectButton, connected && styles.disconnectButton]}
                  onPress={() => (connected && account ? handleDisconnect(account) : handleConnect(id))}
                >
                  <Text style={[styles.connectButtonText, connected && styles.disconnectButtonText]}>
                    {connected ? 'Disconnect' : 'Connect'}
                  </Text>
                </TouchableOpacity>
              </View>
            );
          })}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 16, backgroundColor: '#fff',
    borderBottomWidth: 1, borderBottomColor: '#eee',
  },
  backText: { fontSize: 16, color: '#7F77DD', fontWeight: '600' },
  title: { fontSize: 18, fontWeight: '600', color: '#1a1a1a' },
  refreshText: { fontSize: 14, color: '#7F77DD', fontWeight: '600' },
  content: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  errorText: { color: '#F44336', marginBottom: 8 },
  retryText: { color: '#7F77DD', fontWeight: '600' },
  accountRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: '#fff', paddingHorizontal: 20, paddingVertical: 16,
    borderBottomWidth: 1, borderBottomColor: '#f0f0f0',
  },
  accountInfo: { flex: 1 },
  platformName: { fontSize: 16, fontWeight: '500', color: '#1a1a1a' },
  accountName: { fontSize: 13, color: '#999', marginTop: 2 },
  connectButton: { backgroundColor: '#7F77DD', borderRadius: 8, paddingHorizontal: 16, paddingVertical: 8 },
  disconnectButton: { backgroundColor: 'transparent', borderWidth: 1, borderColor: '#F44336' },
  connectButtonText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  disconnectButtonText: { color: '#F44336' },
});
