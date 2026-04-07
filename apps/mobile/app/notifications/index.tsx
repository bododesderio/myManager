import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/services/apiClient';

interface Notification {
  id: string;
  type: string;
  title: string;
  body: string;
  read: boolean;
  read_at?: string;
  created_at: string;
  data?: Record<string, unknown>;
}

function relTime(iso: string) {
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return d.toLocaleDateString();
}

export default function NotificationsScreen() {
  const qc = useQueryClient();
  const { data, isLoading, isError, error, refetch, isRefetching } = useQuery({
    queryKey: ['notifications'],
    queryFn: () =>
      apiClient.get<{ data?: Notification[]; notifications?: Notification[] }>('/notifications'),
  });

  const list: Notification[] =
    (data as any)?.data ?? (data as any)?.notifications ?? (data as any) ?? [];

  const markRead = useMutation({
    mutationFn: (id: string) => apiClient.put(`/notifications/${id}/read`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const markAllRead = useMutation({
    mutationFn: () => apiClient.put('/notifications/read-all'),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });

  function handlePress(n: Notification) {
    if (!n.read) markRead.mutate(n.id);
    // Deep-link by type
    const data = (n.data ?? {}) as Record<string, any>;
    if (data.postId) router.push(`/post/${data.postId}` as any);
    else if (data.projectId) router.push(`/projects/${data.projectId}` as any);
    else if (n.type === 'approval_required') router.push('/approvals' as any);
    else if (n.type === 'comment_received') router.push('/conversations' as any);
  }

  const renderItem = ({ item }: { item: Notification }) => (
    <TouchableOpacity
      style={[styles.row, !item.read && styles.unreadRow]}
      onPress={() => handlePress(item)}
    >
      {!item.read && <View style={styles.unreadDot} />}
      <View style={{ flex: 1 }}>
        <Text style={[styles.title, !item.read && styles.titleUnread]}>{item.title}</Text>
        <Text style={styles.body} numberOfLines={2}>
          {item.body}
        </Text>
        <Text style={styles.time}>{relTime(item.created_at)}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
        <TouchableOpacity onPress={() => markAllRead.mutate()} disabled={list.length === 0}>
          <Text style={[styles.markAllText, list.length === 0 && { opacity: 0.4 }]}>Mark all</Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color="#7F77DD" />
        </View>
      ) : isError ? (
        <View style={styles.center}>
          <Text style={styles.errorText}>{(error as Error)?.message ?? 'Failed to load'}</Text>
          <TouchableOpacity onPress={() => refetch()}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : list.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyTitle}>You're all caught up</Text>
          <Text style={styles.emptyBody}>Notifications will appear here when something happens.</Text>
        </View>
      ) : (
        <FlatList
          data={list}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
        />
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
  headerTitle: { fontSize: 18, fontWeight: '600', color: '#1a1a1a' },
  markAllText: { fontSize: 14, color: '#7F77DD', fontWeight: '600' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  list: { padding: 16 },
  row: {
    flexDirection: 'row', backgroundColor: '#fff', borderRadius: 12,
    padding: 16, marginBottom: 8, alignItems: 'flex-start',
  },
  unreadRow: { backgroundColor: '#F3F2FF' },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#7F77DD', marginTop: 6, marginRight: 12 },
  title: { fontSize: 15, fontWeight: '500', color: '#1a1a1a' },
  titleUnread: { fontWeight: '700' },
  body: { fontSize: 13, color: '#666', marginTop: 2 },
  time: { fontSize: 11, color: '#999', marginTop: 6 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: '#1a1a1a', marginBottom: 8 },
  emptyBody: { fontSize: 14, color: '#999', textAlign: 'center' },
  errorText: { color: '#F44336', marginBottom: 8 },
  retryText: { color: '#7F77DD', fontWeight: '600' },
});
