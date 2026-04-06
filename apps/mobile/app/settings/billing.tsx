import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Linking } from 'react-native';
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
  currentPlan: { backgroundColor: '#7F77DD', borderRadius: 12, padding: 24, alignItems: 'center', marginBottom: 16 },
  planLabel: { fontSize: 14, color: 'rgba(255,255,255,0.7)', marginBottom: 4 },
  planName: { fontSize: 28, fontWeight: '700', color: '#fff', marginBottom: 4 },
  planPrice: { fontSize: 16, color: 'rgba(255,255,255,0.9)' },
  planStatus: { fontSize: 12, color: 'rgba(255,255,255,0.8)', marginTop: 6 },
  upgradeButton: { backgroundColor: '#7F77DD', borderRadius: 12, padding: 16, alignItems: 'center', marginBottom: 16 },
  upgradeButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  section: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: '#1a1a1a', marginBottom: 12 },
  emptyState: { alignItems: 'center', paddingVertical: 20 },
  emptyText: { fontSize: 14, color: '#999' },
  historyRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  historyPlan: { fontSize: 15, fontWeight: '600', color: '#1a1a1a' },
  historyDate: { fontSize: 12, color: '#999', marginTop: 2 },
  historyAmount: { fontSize: 15, fontWeight: '600', color: '#1a1a1a' },
  historyStatus: { fontSize: 12, color: '#999', marginTop: 2, textTransform: 'capitalize' },
});
