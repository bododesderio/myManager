import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { styles } from './[id].styles';
import { useLocalSearchParams, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { usePost, useDeletePost, useDuplicatePost } from '@/hooks/usePosts';

export default function PostDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data, isLoading, isError, error, refetch } = usePost(id!);
  const deletePost = useDeletePost();
  const duplicatePost = useDuplicatePost();

  const post: any = data;

  function handleDelete() {
    Alert.alert('Delete post', 'Are you sure? This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          deletePost.mutate(id!, {
            onSuccess: () => router.back(),
            onError: (e: any) => Alert.alert('Failed', e?.message ?? 'Could not delete'),
          });
        },
      },
    ]);
  }

  function handleDuplicate() {
    duplicatePost.mutate(id!, {
      onSuccess: (newPost: any) => {
        Alert.alert('Duplicated', 'A copy was created as a draft.');
        if (newPost?.id) router.replace(`/post/${newPost.id}` as any);
      },
      onError: (e: any) => Alert.alert('Failed', e?.message ?? 'Could not duplicate'),
    });
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Post Details</Text>
        <TouchableOpacity onPress={() => router.push(`/compose/new?postId=${id}` as any)}>
          <Text style={styles.editText}>Edit</Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color="#7F77DD" />
        </View>
      ) : isError || !post ? (
        <View style={styles.center}>
          <Text style={styles.errorText}>{(error as Error)?.message ?? 'Failed to load post'}</Text>
          <TouchableOpacity onPress={() => refetch()} style={styles.retryBtn}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView style={styles.content}>
          <View style={[styles.statusBadge, statusStyle(post.status)]}>
            <Text style={styles.statusText}>{(post.status ?? 'draft').toUpperCase()}</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Content</Text>
            <Text style={styles.postContent}>{post.caption ?? post.title ?? 'Untitled'}</Text>
            {post.scheduled_at && (
              <Text style={styles.meta}>
                Scheduled for {new Date(post.scheduled_at).toLocaleString()}
              </Text>
            )}
            {post.published_at && (
              <Text style={styles.meta}>
                Published {new Date(post.published_at).toLocaleString()}
              </Text>
            )}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Platforms</Text>
            <View style={styles.platformList}>
              {(post.platforms ?? []).length > 0 ? (
                (post.platforms as string[]).map((p) => (
                  <View key={p} style={styles.platformBadge}>
                    <Text style={styles.platformBadgeText}>{p}</Text>
                  </View>
                ))
              ) : (
                <Text style={styles.meta}>No platforms</Text>
              )}
            </View>
          </View>

          {post.analytics && post.analytics.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Performance</Text>
              {post.analytics.map((a: any) => (
                <View key={a.platform} style={styles.analyticsRow}>
                  <Text style={styles.analyticsPlatform}>{a.platform}</Text>
                  <View style={styles.metricsRow}>
                    <Metric label="Likes" value={a.likes} />
                    <Metric label="Comments" value={a.comments} />
                    <Metric label="Shares" value={a.shares} />
                    <Metric label="Reach" value={a.reach ?? a.impressions} />
                  </View>
                </View>
              ))}
            </View>
          )}

          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleDuplicate}
              disabled={duplicatePost.isPending}
            >
              <Text style={styles.actionButtonText}>
                {duplicatePost.isPending ? 'Duplicating…' : 'Duplicate'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.deleteButton]}
              onPress={handleDelete}
              disabled={deletePost.isPending}
            >
              <Text style={styles.deleteButtonText}>
                {deletePost.isPending ? 'Deleting…' : 'Delete'}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

function Metric({ label, value }: { label: string; value?: number }) {
  return (
    <View style={styles.metricItem}>
      <Text style={styles.metricValue}>{value ?? 0}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

function statusStyle(status?: string) {
  switch (status) {
    case 'PUBLISHED':
    case 'published':
      return { backgroundColor: '#E8F5E9' };
    case 'SCHEDULED':
    case 'scheduled':
      return { backgroundColor: '#FFF3E0' };
    case 'FAILED':
    case 'failed':
      return { backgroundColor: '#FFEBEE' };
    default:
      return { backgroundColor: '#ECEFF1' };
  }
}
