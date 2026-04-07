import { colors } from '@/theme/colors';
import { View, Text, TouchableOpacity, FlatList, ActivityIndicator } from 'react-native';
import { styles } from './compose.styles';
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
      const data = await apiClient.get<{ posts: Draft[] }>('/posts', {
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
          <ActivityIndicator size="large" color=colors.primary />
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
