import { View, Text, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { useState, useEffect, useCallback } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { apiClient } from '@/services/apiClient';

interface Draft {
  id: string;
  title: string;
  platform: string;
  updatedAt: string;
}

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

export default function ComposeTabScreen() {
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDrafts = useCallback(async () => {
    try {
      setError(null);
      setLoading(true);
      const data = await apiClient.get<{ posts: Draft[] }>('/v1/posts', {
        params: { status: 'draft' },
      });
      setDrafts(data.posts ?? []);
    } catch (error: unknown) {
      setError(getErrorMessage(error, 'Failed to load drafts'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDrafts();
  }, [fetchDrafts]);

  const renderDraft = ({ item }: { item: Draft }) => (
    <TouchableOpacity style={styles.draftCard}>
      <View style={styles.draftInfo}>
        <Text style={styles.draftTitle}>{item.title}</Text>
        <Text style={styles.draftMeta}>{item.platform} - {item.updatedAt}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Compose</Text>
        <TouchableOpacity
          style={styles.newButton}
          onPress={() => router.push('/compose/new')}
        >
          <Text style={styles.newButtonText}>+ New Post</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.tabs}>
        <TouchableOpacity style={[styles.tab, styles.tabActive]}>
          <Text style={[styles.tabText, styles.tabTextActive]}>Drafts</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tab}>
          <Text style={styles.tabText}>Scheduled</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tab}>
          <Text style={styles.tabText}>Published</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.emptyState}>
          <ActivityIndicator size="large" color="#7F77DD" />
        </View>
      ) : error ? (
        <View style={styles.emptyState}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={fetchDrafts}>
            <Text style={styles.retryText}>Tap to retry</Text>
          </TouchableOpacity>
        </View>
      ) : drafts.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>📝</Text>
          <Text style={styles.emptyTitle}>No drafts yet</Text>
          <Text style={styles.emptyText}>Create your first post to get started</Text>
          <TouchableOpacity
            style={styles.createButton}
            onPress={() => router.push('/compose/new')}
          >
            <Text style={styles.createButtonText}>Create Post</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={drafts}
          renderItem={renderDraft}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
        />
      )}
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
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  newButton: {
    backgroundColor: '#7F77DD',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  newButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  tab: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: '#7F77DD',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#999',
  },
  tabTextActive: {
    color: '#7F77DD',
  },
  list: {
    padding: 16,
  },
  draftCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  draftInfo: {
    gap: 4,
  },
  draftTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  draftMeta: {
    fontSize: 13,
    color: '#999',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginBottom: 24,
  },
  createButton: {
    backgroundColor: '#7F77DD',
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  createButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  errorText: {
    fontSize: 14,
    color: '#F44336',
    textAlign: 'center',
    marginBottom: 8,
  },
  retryText: {
    fontSize: 14,
    color: '#7F77DD',
    fontWeight: '600',
  },
});
