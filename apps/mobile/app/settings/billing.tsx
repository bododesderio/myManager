import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

interface PlanFeature {
  name: string;
  included: boolean;
}

const currentPlanFeatures: PlanFeature[] = [
  { name: '5 social accounts', included: true },
  { name: '30 scheduled posts', included: true },
  { name: 'Basic analytics', included: true },
  { name: 'Team collaboration', included: false },
  { name: 'Advanced reports', included: false },
  { name: 'AI content suggestions', included: false },
];

export default function BillingSettingsScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Billing & Plan</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.currentPlan}>
          <Text style={styles.planLabel}>Current Plan</Text>
          <Text style={styles.planName}>Free</Text>
          <Text style={styles.planPrice}>$0/month</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Plan Features</Text>
          {currentPlanFeatures.map((feature) => (
            <View key={feature.name} style={styles.featureRow}>
              <Text style={styles.featureIcon}>
                {feature.included ? 'V' : 'X'}
              </Text>
              <Text
                style={[
                  styles.featureName,
                  !feature.included && styles.featureDisabled,
                ]}
              >
                {feature.name}
              </Text>
            </View>
          ))}
        </View>

        <TouchableOpacity style={styles.upgradeButton}>
          <Text style={styles.upgradeButtonText}>Upgrade Plan</Text>
        </TouchableOpacity>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Billing History</Text>
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No billing history</Text>
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
  currentPlan: {
    backgroundColor: '#7F77DD',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
  },
  planLabel: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    marginBottom: 4,
  },
  planName: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  planPrice: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
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
    marginBottom: 12,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    gap: 12,
  },
  featureIcon: {
    fontSize: 14,
    fontWeight: '700',
    color: '#7F77DD',
    width: 20,
    textAlign: 'center',
  },
  featureName: {
    fontSize: 15,
    color: '#1a1a1a',
  },
  featureDisabled: {
    color: '#ccc',
  },
  upgradeButton: {
    backgroundColor: '#7F77DD',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  upgradeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
  },
});
