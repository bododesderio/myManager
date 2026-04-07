import { colors } from '@/theme/colors';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { styles } from './index.styles';
import { router } from 'expo-router';
import { useState, useEffect, useCallback } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { apiClient } from '@/services/apiClient';
import { useWorkspaceStore } from '@/store/workspaceStore';

interface RawComment {
  id: string;
  author_name?: string;
  authorName?: string;
  platform: string;
  text?: string;
  body?: string;
  created_at?: string;
  createdAt?: string;
  status?: string;
}

interface Conversation {
  id: string;
  contact: string;
  platform: string;
  lastMessage: string;
  timestamp: string;
  unread: boolean;
}

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

function relTime(iso?: string) {
  if (!iso) return '';
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'now';
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  return d.toLocaleDateString();
}

export default function ConversationsScreen() {
  const workspaceId = useWorkspaceStore((s) => s.currentWorkspace?.id ?? null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchConversations = useCallback(async () => {
    if (!workspaceId) {
      setLoading(false);
      return;
    }
    try {
      setError(null);
      setLoading(true);
      const data = await apiClient.get<{ data?: RawComment[]; comments?: RawComment[] }>(
        '/comments',
        { params: { workspaceId } },
      );
      const raw: RawComment[] = data.data ?? data.comments ?? (data as any) ?? [];
      const mapped: Conversation[] = raw.map((c) => ({
        id: c.id,
        contact: c.authorName ?? c.author_name ?? 'Unknown',
        platform: c.platform,
        lastMessage: c.text ?? c.body ?? '',
        timestamp: relTime(c.createdAt ?? c.created_at),
        unread: c.status === 'unread' || c.status === 'new',
      }));
      setConversations(mapped);
    } catch (error: unknown) {
      setError(getErrorMessage(error, 'Failed to load conversations'));
    } finally {
      setLoading(false);
    }
  }, [workspaceId]);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  const renderItem = ({ item }: { item: Conversation }) => (
    <TouchableOpacity style={styles.conversationRow}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{item.contact[0]}</Text>
      </View>
      <View style={styles.conversationInfo}>
        <View style={styles.conversationHeader}>
          <Text style={[styles.contactName, item.unread && styles.unreadText]}>
            {item.contact}
          </Text>
          <Text style={styles.timestamp}>{item.timestamp}</Text>
        </View>
        <Text style={styles.lastMessage} numberOfLines={1}>
          {item.lastMessage}
        </Text>
        <Text style={styles.platform}>{item.platform}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Conversations</Text>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <View style={styles.emptyState}>
          <ActivityIndicator size="large" color=colors.primary />
        </View>
      ) : error ? (
        <View style={styles.emptyState}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={fetchConversations}>
            <Text style={styles.retryText}>Tap to retry</Text>
          </TouchableOpacity>
        </View>
      ) : conversations.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>No Conversations</Text>
          <Text style={styles.emptyText}>
            Messages from your social accounts will appear here
          </Text>
        </View>
      ) : (
        <FlatList
          data={conversations}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
        />
      )}
    </SafeAreaView>
  );
}
