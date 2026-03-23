import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch } from 'react-native';
import { router } from 'expo-router';
import { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';

interface NotificationSetting {
  key: string;
  label: string;
  description: string;
}

const notificationSettings: NotificationSetting[] = [
  { key: 'postPublished', label: 'Post Published', description: 'When a scheduled post is published' },
  { key: 'postFailed', label: 'Post Failed', description: 'When a post fails to publish' },
  { key: 'approvalRequired', label: 'Approval Required', description: 'When a post needs your approval' },
  { key: 'comments', label: 'New Comments', description: 'When someone comments on your posts' },
  { key: 'messages', label: 'Direct Messages', description: 'New messages from social accounts' },
  { key: 'teamActivity', label: 'Team Activity', description: 'When team members make changes' },
  { key: 'weeklyReport', label: 'Weekly Report', description: 'Weekly performance summary' },
];

export default function NotificationsSettingsScreen() {
  const [settings, setSettings] = useState<Record<string, boolean>>({
    postPublished: true,
    postFailed: true,
    approvalRequired: true,
    comments: true,
    messages: false,
    teamActivity: false,
    weeklyReport: true,
  });

  const toggleSetting = (key: string) => {
    setSettings((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Notifications</Text>
        <View style={{ width: 40 }} />
      </View>

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
                value={settings[setting.key] ?? false}
                onValueChange={() => toggleSetting(setting.key)}
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
              <Text style={styles.settingDescription}>
                Receive a daily email summary
              </Text>
            </View>
            <Switch
              value={false}
              trackColor={{ false: '#ddd', true: '#7F77DD' }}
              thumbColor="#fff"
            />
          </View>
        </View>
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
    padding: 16,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: '#1a1a1a',
  },
  settingDescription: {
    fontSize: 13,
    color: '#999',
    marginTop: 2,
  },
});
