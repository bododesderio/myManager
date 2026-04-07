import { colors } from '@/theme/colors';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { styles } from './[id].styles';
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
          <ActivityIndicator color=colors.primary />
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
