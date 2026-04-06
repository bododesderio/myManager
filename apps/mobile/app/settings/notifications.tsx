import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, ActivityIndicator, Alert } from 'react-native';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiClient } from '@/services/apiClient';

interface NotificationSetting {
  key: string;
  label: string;
  description: string;
}

const notificationSettings: NotificationSetting[] = [
  { key: 'post_published', label: 'Post Published', description: 'When a scheduled post is published' },
  { key: 'post_failed', label: 'Post Failed', description: 'When a post fails to publish' },
  { key: 'approval_required', label: 'Approval Required', description: 'When a post needs your approval' },
  { key: 'comment_received', label: 'New Comments', description: 'When someone comments on your posts' },
  { key: 'message_received', label: 'Direct Messages', description: 'New messages from social accounts' },
  { key: 'team_activity', label: 'Team Activity', description: 'When team members make changes' },
  { key: 'weekly_report', label: 'Weekly Report', description: 'Weekly performance summary' },
];

interface PrefRow {
  event_type: string;
  channel: string;
  enabled: boolean;
}

export default function NotificationsSettingsScreen() {
  const { data, isLoading } = useQuery({
    queryKey: ['notif-prefs'],
    queryFn: () => apiClient.get<PrefRow[]>('/notifications/preferences'),
  });

  const [push, setPush] = useState<Record<string, boolean>>({});
  const [emailDigest, setEmailDigest] = useState(false);

  useEffect(() => {
    if (Array.isArray(data)) {
      const next: Record<string, boolean> = {};
      let digest = false;
      for (const r of data) {
        if (r.channel === 'push') next[r.event_type] = r.enabled;
        if (r.event_type === 'email_digest' && r.channel === 'email') digest = r.enabled;
      }
      setPush(next);
      setEmailDigest(digest);
    }
  }, [data]);

  const updatePref = useMutation({
    mutationFn: ({ eventType, channels }: { eventType: string; channels: Record<string, boolean> }) =>
      apiClient.put('/notifications/preferences', { eventType, channels }),
    onError: (e: any) => Alert.alert('Failed', e?.message ?? 'Could not save preference'),
  });

  function togglePush(key: string) {
    const next = !(push[key] ?? false);
    setPush((prev) => ({ ...prev, [key]: next }));
    updatePref.mutate({ eventType: key, channels: { push: next } });
  }

  function toggleEmailDigest(value: boolean) {
    setEmailDigest(value);
    updatePref.mutate({ eventType: 'email_digest', channels: { email: value } });
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Notifications</Text>
        <View style={{ width: 40 }} />
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color="#7F77DD" />
        </View>
      ) : (
        <ScrollView style={styles.content}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Push Notifications</Text>
            {notificationSettings.map((setting) => (
              <View key={setting.key} style={styles.settingRow}>
                <View style={styles.settingInfo}>
                  <Text style={styles.settingLabel}>{setting.label}</Text>
                  <Text style={styles.settingDescription}>{setting.description}</Text>
                </View>
                <Switch
                  value={push[setting.key] ?? false}
                  onValueChange={() => togglePush(setting.key)}
                  trackColor={{ false: '#ddd', true: '#7F77DD' }}
                  thumbColor="#fff"
                />
              </View>
            ))}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Email Notifications</Text>
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Email Digest</Text>
                <Text style={styles.settingDescription}>Receive a daily email summary</Text>
              </View>
              <Switch
                value={emailDigest}
                onValueChange={toggleEmailDigest}
                trackColor={{ false: '#ddd', true: '#7F77DD' }}
                thumbColor="#fff"
              />
            </View>
          </View>
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
  content: { flex: 1, padding: 16 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  section: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: '#1a1a1a', marginBottom: 8 },
  settingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  settingInfo: { flex: 1, marginRight: 16 },
  settingLabel: { fontSize: 15, fontWeight: '500', color: '#1a1a1a' },
  settingDescription: { fontSize: 13, color: '#999', marginTop: 2 },
});
