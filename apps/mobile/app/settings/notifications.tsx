import { colors } from '@/theme/colors';
import { View, Text, ScrollView, TouchableOpacity, Switch, ActivityIndicator, Alert } from 'react-native';
import { styles } from './notifications.styles';
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
          <ActivityIndicator color=colors.primary />
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
                  trackColor={{ false: '#ddd', true: colors.primary }}
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
                trackColor={{ false: '#ddd', true: colors.primary }}
                thumbColor="#fff"
              />
            </View>
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
