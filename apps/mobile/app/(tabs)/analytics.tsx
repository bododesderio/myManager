import { colors } from '@/theme/colors';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { styles } from './analytics.styles';
import { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAnalytics, useTopPosts } from '@/hooks/useAnalytics';
import { useWorkspaceStore } from '@/store/workspaceStore';

type TimePeriod = '7d' | '30d' | '90d';

function fmt(n?: number) {
  if (n == null) return '—';
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return n.toLocaleString();
}

export default function AnalyticsScreen() {
  const [period, setPeriod] = useState<TimePeriod>('30d');
  const workspaceId = useWorkspaceStore((s) => s.currentWorkspace?.id ?? null);
  const overview = useAnalytics(workspaceId, period);
  const topPosts = useTopPosts(workspaceId, period);

  const data = overview.data;
  const metrics = [
    { label: 'Total Reach', value: fmt(data?.reach) },
    { label: 'Engagements', value: fmt(data?.engagements) },
    { label: 'Impressions', value: fmt(data?.impressions) },
    {
      label: 'Engagement Rate',
      value: data?.engagementRate != null ? `${data.engagementRate.toFixed(1)}%` : '—',
    },
  ];

  const topPostsList: any[] = (topPosts.data as any)?.data ?? (topPosts.data as any) ?? [];
  const breakdown = data?.platformBreakdown ?? [];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Analytics</Text>
      </View>

      <View style={styles.periodSelector}>
        {(['7d', '30d', '90d'] as TimePeriod[]).map((p) => (
          <TouchableOpacity
            key={p}
            style={[styles.periodButton, period === p && styles.periodButtonActive]}
            onPress={() => setPeriod(p)}
          >
            <Text style={[styles.periodText, period === p && styles.periodTextActive]}>
              {p === '7d' ? '7 Days' : p === '30d' ? '30 Days' : '90 Days'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={styles.content}>
        {!workspaceId && (
          <View style={styles.section}>
            <Text style={styles.emptyText}>No workspace selected.</Text>
          </View>
        )}

        {overview.isLoading && (
          <View style={styles.center}>
            <ActivityIndicator color=colors.primary />
          </View>
        )}

        {overview.isError && (
          <View style={[styles.section, styles.errorSection]}>
            <Text style={styles.errorText}>
              Failed to load analytics. {(overview.error as Error)?.message ?? ''}
            </Text>
            <TouchableOpacity onPress={() => overview.refetch()} style={styles.retryBtn}>
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}

        {!overview.isLoading && !overview.isError && (
          <>
            <View style={styles.metricsGrid}>
              {metrics.map((metric) => (
                <View key={metric.label} style={styles.metricCard}>
                  <Text style={styles.metricLabel}>{metric.label}</Text>
                  <Text style={styles.metricValue}>{metric.value}</Text>
                </View>
              ))}
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Top Performing Posts</Text>
              {topPosts.isLoading ? (
                <ActivityIndicator color=colors.primary />
              ) : topPostsList.length === 0 ? (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyText}>No data available for this period</Text>
                </View>
              ) : (
                topPostsList.slice(0, 5).map((p: any) => (
                  <View key={p.id} style={styles.postRow}>
                    <Text style={styles.postCaption} numberOfLines={2}>
                      {p.caption || 'Untitled'}
                    </Text>
                    <Text style={styles.postMeta}>
                      {p.platform} · {fmt(p.impressions)} impressions · {fmt(p.engagements)} engagements
                    </Text>
                  </View>
                ))
              )}
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Platform Breakdown</Text>
              {breakdown.length === 0 ? (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyText}>Connect accounts to see platform analytics</Text>
                </View>
              ) : (
                breakdown.map((p) => (
                  <View key={p.platform} style={styles.postRow}>
                    <Text style={styles.postCaption}>{p.platform}</Text>
                    <Text style={styles.postMeta}>
                      Reach {fmt(p.reach)} · Engagements {fmt(p.engagements)}
                    </Text>
                  </View>
                ))
              )}
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
