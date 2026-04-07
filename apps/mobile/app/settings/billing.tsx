import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Linking } from 'react-native';
import { styles } from './billing.styles';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/services/apiClient';

interface Subscription {
  id?: string;
  plan?: { name: string; slug: string; price?: number; currency?: string; features?: Record<string, any> };
  status?: string;
  billing_cycle?: string;
  current_period_end?: string;
}

interface BillingHistoryItem {
  id: string;
  plan_name: string;
  amount: number;
  currency: string;
  status: string;
  created_at: string;
  invoice_url?: string;
}

export default function BillingSettingsScreen() {
  const subscription = useQuery({
    queryKey: ['billing', 'subscription'],
    queryFn: () => apiClient.get<Subscription>('/billing/subscription'),
  });

  const history = useQuery({
    queryKey: ['billing', 'history'],
    queryFn: () =>
      apiClient.get<{ data?: BillingHistoryItem[] } | BillingHistoryItem[]>('/billing/history'),
  });

  const sub = subscription.data;
  const historyList: BillingHistoryItem[] = (history.data as any)?.data ?? (history.data as any) ?? [];

  function handleUpgrade() {
    Alert.alert(
      'Upgrade plan',
      'Open the web app to choose a plan and complete payment?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Open',
          onPress: () => {
            const url = process.env.EXPO_PUBLIC_WEB_URL || 'https://app.mymanager.com';
            Linking.openURL(`${url}/settings/billing`);
          },
        },
      ],
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Billing & Plan</Text>
        <View style={{ width: 40 }} />
      </View>

      {subscription.isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color="#7F77DD" />
        </View>
      ) : (
        <ScrollView style={styles.content}>
          <View style={styles.currentPlan}>
            <Text style={styles.planLabel}>Current Plan</Text>
            <Text style={styles.planName}>{sub?.plan?.name ?? 'Free'}</Text>
            <Text style={styles.planPrice}>
              {sub?.plan?.price != null
                ? `${sub.plan.currency ?? 'USD'} ${sub.plan.price}/${sub.billing_cycle ?? 'month'}`
                : '$0/month'}
            </Text>
            {sub?.status && <Text style={styles.planStatus}>Status: {sub.status}</Text>}
            {sub?.current_period_end && (
              <Text style={styles.planStatus}>
                Renews {new Date(sub.current_period_end).toLocaleDateString()}
              </Text>
            )}
          </View>

          <TouchableOpacity style={styles.upgradeButton} onPress={handleUpgrade}>
            <Text style={styles.upgradeButtonText}>
              {sub?.plan && sub.plan.slug !== 'free' ? 'Manage Plan' : 'Upgrade Plan'}
            </Text>
          </TouchableOpacity>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Billing History</Text>
            {history.isLoading ? (
              <ActivityIndicator color="#7F77DD" />
            ) : historyList.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>No billing history</Text>
              </View>
            ) : (
              historyList.map((row) => (
                <TouchableOpacity
                  key={row.id}
                  style={styles.historyRow}
                  onPress={() => row.invoice_url && Linking.openURL(row.invoice_url)}
                >
                  <View>
                    <Text style={styles.historyPlan}>{row.plan_name}</Text>
                    <Text style={styles.historyDate}>
                      {new Date(row.created_at).toLocaleDateString()}
                    </Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={styles.historyAmount}>
                      {row.currency} {row.amount.toFixed(2)}
                    </Text>
                    <Text style={[styles.historyStatus, row.status === 'paid' && { color: '#10B981' }]}>
                      {row.status}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))
            )}
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
