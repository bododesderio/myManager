import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

interface SocialAccount {
  platform: string;
  name: string;
  connected: boolean;
}

const socialPlatforms: SocialAccount[] = [
  { platform: 'Facebook', name: '', connected: false },
  { platform: 'Instagram', name: '', connected: false },
  { platform: 'Twitter / X', name: '', connected: false },
  { platform: 'LinkedIn', name: '', connected: false },
  { platform: 'TikTok', name: '', connected: false },
  { platform: 'Pinterest', name: '', connected: false },
  { platform: 'YouTube', name: '', connected: false },
];

export default function AccountsSettingsScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Connected Accounts</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content}>
        {socialPlatforms.map((account) => (
          <View key={account.platform} style={styles.accountRow}>
            <View style={styles.accountInfo}>
              <Text style={styles.platformName}>{account.platform}</Text>
              {account.connected && (
                <Text style={styles.accountName}>{account.name}</Text>
              )}
            </View>
            <TouchableOpacity
              style={[
                styles.connectButton,
                account.connected && styles.disconnectButton,
              ]}
            >
              <Text
                style={[
                  styles.connectButtonText,
                  account.connected && styles.disconnectButtonText,
                ]}
              >
                {account.connected ? 'Disconnect' : 'Connect'}
              </Text>
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backText: {
    fontSize: 16,
    color: '#7F77DD',
    fontWeight: '600',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  content: {
    flex: 1,
  },
  accountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  accountInfo: {
    flex: 1,
  },
  platformName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1a1a1a',
  },
  accountName: {
    fontSize: 13,
    color: '#999',
    marginTop: 2,
  },
  connectButton: {
    backgroundColor: '#7F77DD',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  disconnectButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#F44336',
  },
  connectButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  disconnectButtonText: {
    color: '#F44336',
  },
});
