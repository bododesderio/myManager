import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { styles } from './settings.styles';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '@/store/authStore';
import { useAuth } from '@/hooks/useAuth';

interface SettingsItem {
  label: string;
  icon: string;
  route: string;
}

const settingsItems: SettingsItem[] = [
  { label: 'Connected Accounts', icon: '🔗', route: '/settings/accounts' },
  { label: 'Billing & Plan', icon: '💳', route: '/settings/billing' },
  { label: 'Security', icon: '🔒', route: '/settings/security' },
  { label: 'Team Members', icon: '👥', route: '/settings/team' },
  { label: 'Notifications', icon: '🔔', route: '/settings/notifications' },
  { label: 'Language', icon: '🌐', route: '/settings/language' },
];

export default function SettingsScreen() {
  const { user } = useAuthStore();
  const { logout } = useAuth();

  const displayName = user?.name || 'User';
  const displayEmail = user?.email || 'Not signed in';
  const avatarInitial = displayName.charAt(0).toUpperCase();

  const handleSignOut = async () => {
    await logout();
    router.replace('/');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Settings</Text>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.profileSection}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{avatarInitial}</Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{displayName}</Text>
            <Text style={styles.profileEmail}>{displayEmail}</Text>
          </View>
        </View>

        <View style={styles.section}>
          {settingsItems.map((item) => (
            <TouchableOpacity
              key={item.label}
              style={styles.settingsRow}
              onPress={() => router.push(item.route as never)}
            >
              <Text style={styles.settingsIcon}>{item.icon}</Text>
              <Text style={styles.settingsLabel}>{item.label}</Text>
              <Text style={styles.chevron}>{'>'}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={handleSignOut}>
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>

        <Text style={styles.version}>Version 1.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}
