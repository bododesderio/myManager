import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { useState, useCallback, useEffect } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { apiClient } from '@/services/apiClient';

interface QuickAction {
  label: string;
  icon: string;
  route: string;
}

interface Post {
  id: string;
  title?: string;
  content?: string;
  status: string;
  scheduledAt?: string;
  createdAt: string;
}

interface DashboardData {
  recentPosts: Post[];
  metrics: {
    totalPosts: number;
    totalEngagement: number;
    totalReach: number;
  };
}

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

const quickActions: QuickAction[] = [
  { label: 'New Post', icon: '+', route: '/compose/new' },
  { label: 'Approvals', icon: '!', route: '/approvals' },
  { label: 'Messages', icon: '@', route: '/conversations' },
  { label: 'Reports', icon: '#', route: '/reports' },
];

export default function HomeScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const [recentPosts, setRecentPosts] = useState<Post[]>([]);
  const [metrics, setMetrics] = useState({ totalPosts: 0, totalEngagement: 0, totalReach: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboard = useCallback(async () => {
    try {
      setError(null);
      const data = await apiClient.get<{ posts: Post[] }>('/posts', {
        params: { status: 'published', limit: '5' },
      });
      setRecentPosts(data.posts ?? []);
    } catch {
      // Try dashboard endpoint as fallback
      try {
        const dashboard = await apiClient.get<DashboardData>('/dashboard');
        setRecentPosts(dashboard.recentPosts ?? []);
        if (dashboard.metrics) {
          setMetrics(dashboard.metrics);
        }
      } catch (error: unknown) {
        setError(getErrorMessage(error, 'Failed to load dashboard'));
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchDashboard();
  }, [fetchDashboard]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.greeting}>Good morning</Text>
        <Text style={styles.title}>Dashboard</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#7F77DD" />}
      >
        <View style={styles.quickActions}>
          {quickActions.map((action) => (
            <TouchableOpacity
              key={action.label}
              style={styles.actionCard}
              onPress={() => router.push(action.route as never)}
            >
              <Text style={styles.actionIcon}>{action.icon}</Text>
              <Text style={styles.actionLabel}>{action.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#7F77DD" />
          </View>
        ) : error ? (
          <View style={styles.section}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity onPress={onRefresh}>
              <Text style={styles.emptyLink}>Tap to retry</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Upcoming Posts</Text>
              {recentPosts.length === 0 ? (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyText}>No scheduled posts</Text>
                  <TouchableOpacity onPress={() => router.push('/compose/new')}>
                    <Text style={styles.emptyLink}>Create your first post</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                recentPosts.map((post) => (
                  <View key={post.id} style={styles.postRow}>
                    <Text style={styles.postTitle}>{post.title || post.content?.slice(0, 50) || 'Untitled'}</Text>
                    <Text style={styles.postMeta}>{post.scheduledAt || post.createdAt}</Text>
                  </View>
                ))
              )}
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Recent Activity</Text>
              {recentPosts.length === 0 ? (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyText}>No recent activity</Text>
                </View>
              ) : (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyText}>{recentPosts.length} recent posts</Text>
                </View>
              )}
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Performance Overview</Text>
              <View style={styles.metricsRow}>
                <View style={styles.metricCard}>
                  <Text style={styles.metricValue}>{metrics.totalPosts}</Text>
                  <Text style={styles.metricLabel}>Posts</Text>
                </View>
                <View style={styles.metricCard}>
                  <Text style={styles.metricValue}>{metrics.totalEngagement}</Text>
                  <Text style={styles.metricLabel}>Engagement</Text>
                </View>
                <View style={styles.metricCard}>
                  <Text style={styles.metricValue}>{metrics.totalReach}</Text>
                  <Text style={styles.metricLabel}>Reach</Text>
                </View>
              </View>
            </View>
          </>
        )}
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
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  greeting: {
    fontSize: 14,
    color: '#999',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  scrollView: {
    flex: 1,
  },
  quickActions: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 12,
  },
  actionCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  actionIcon: {
    fontSize: 20,
    color: '#7F77DD',
    fontWeight: '700',
    marginBottom: 4,
  },
  actionLabel: {
    fontSize: 11,
    color: '#666',
    fontWeight: '500',
  },
  section: {
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 12,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    marginBottom: 8,
  },
  emptyLink: {
    fontSize: 14,
    color: '#7F77DD',
    fontWeight: '600',
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  metricCard: {
    flex: 1,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  metricValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#7F77DD',
  },
  metricLabel: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  loadingContainer: {
    paddingVertical: 48,
    alignItems: 'center',
  },
  errorText: {
    fontSize: 14,
    color: '#F44336',
    textAlign: 'center',
    marginBottom: 8,
  },
  postRow: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  postTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1a1a1a',
  },
  postMeta: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
});
