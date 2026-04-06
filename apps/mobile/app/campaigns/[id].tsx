import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCampaign, useDeleteCampaign } from '@/hooks/useCampaigns';

export default function CampaignDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: campaign, isLoading, isError, error, refetch } = useCampaign(id!);
  const deleteCampaign = useDeleteCampaign();

  function handleDelete() {
    Alert.alert('Delete campaign', 'This cannot be undone. Continue?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          deleteCampaign.mutate(id!, {
            onSuccess: () => router.back(),
            onError: (e: any) => Alert.alert('Failed', e?.message ?? 'Could not delete'),
          });
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
        <Text style={styles.title}>Campaign</Text>
        <View style={{ width: 50 }} />
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color="#7F77DD" />
        </View>
      ) : isError || !campaign ? (
        <View style={styles.center}>
          <Text style={styles.errorText}>{(error as Error)?.message ?? 'Failed to load campaign'}</Text>
          <TouchableOpacity onPress={() => refetch()} style={styles.retryBtn}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView style={styles.content}>
          <View style={styles.section}>
            <Text style={styles.name}>{campaign.name}</Text>
            {campaign.description && <Text style={styles.description}>{campaign.description}</Text>}
            {(campaign.start_date || campaign.end_date) && (
              <Text style={styles.meta}>
                {campaign.start_date?.slice(0, 10) ?? '?'} → {campaign.end_date?.slice(0, 10) ?? '?'}
              </Text>
            )}
            {campaign.status && <Text style={styles.meta}>Status: {campaign.status}</Text>}
          </View>

          <TouchableOpacity
            style={[styles.actionButton, styles.deleteButton]}
            onPress={handleDelete}
            disabled={deleteCampaign.isPending}
          >
            <Text style={styles.deleteText}>
              {deleteCampaign.isPending ? 'Deleting…' : 'Delete Campaign'}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
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
  backText: { fontSize: 16, color: '#7F77DD', fontWeight: '600' },
  title: { fontSize: 18, fontWeight: '600', color: '#1a1a1a' },
  content: { flex: 1, padding: 16 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  section: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 16 },
  name: { fontSize: 22, fontWeight: '700', color: '#1a1a1a', marginBottom: 8 },
  description: { fontSize: 15, color: '#444', lineHeight: 22, marginBottom: 12 },
  meta: { fontSize: 13, color: '#777', marginTop: 4 },
  actionButton: { borderWidth: 1, borderRadius: 12, padding: 14, alignItems: 'center', marginBottom: 16 },
  deleteButton: { borderColor: '#F44336' },
  deleteText: { color: '#F44336', fontSize: 15, fontWeight: '600' },
  errorText: { color: '#F44336', textAlign: 'center', marginBottom: 8 },
  retryBtn: { paddingHorizontal: 16, paddingVertical: 8, backgroundColor: '#7F77DD', borderRadius: 6 },
  retryText: { color: '#fff', fontWeight: '600' },
});
