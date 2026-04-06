import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { useState, useEffect, useCallback } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { apiClient } from '@/services/apiClient';
import { useWorkspaceStore } from '@/store/workspaceStore';

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: 'owner' | 'admin' | 'editor' | 'viewer';
}

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

export default function TeamSettingsScreen() {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const currentWorkspace = useWorkspaceStore((s) => s.currentWorkspace);

  const fetchMembers = useCallback(async () => {
    if (!currentWorkspace?.id) {
      setLoading(false);
      return;
    }
    try {
      setError(null);
      setLoading(true);
      const data = await apiClient.get<{ members: TeamMember[] }>(
        `/v1/workspaces/${currentWorkspace.id}/members`
      );
      setMembers(data.members ?? []);
    } catch (error: unknown) {
      setError(getErrorMessage(error, 'Failed to load team members'));
    } finally {
      setLoading(false);
    }
  }, [currentWorkspace?.id]);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  const renderItem = ({ item }: { item: TeamMember }) => (
    <View style={styles.memberRow}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{item.name[0]}</Text>
      </View>
      <View style={styles.memberInfo}>
        <Text style={styles.memberName}>{item.name}</Text>
        <Text style={styles.memberEmail}>{item.email}</Text>
      </View>
      <View style={styles.roleBadge}>
        <Text style={styles.roleText}>{item.role}</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Team Members</Text>
        <TouchableOpacity>
          <Text style={styles.inviteText}>Invite</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#7F77DD" />
        </View>
      ) : error ? (
        <View style={styles.loadingContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={fetchMembers}>
            <Text style={styles.retryText}>Tap to retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={members}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          ListEmptyComponent={
            <View style={styles.loadingContainer}>
              <Text style={styles.emptyText}>No team members found</Text>
            </View>
          }
          ListFooterComponent={
            <TouchableOpacity style={styles.inviteButton}>
              <Text style={styles.inviteButtonText}>+ Invite Team Member</Text>
            </TouchableOpacity>
          }
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
  inviteText: {
    fontSize: 16,
    color: '#7F77DD',
    fontWeight: '600',
  },
  list: {
    padding: 16,
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#7F77DD',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1a1a1a',
  },
  memberEmail: {
    fontSize: 13,
    color: '#999',
    marginTop: 2,
  },
  roleBadge: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  roleText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    textTransform: 'capitalize',
  },
  inviteButton: {
    borderWidth: 1,
    borderColor: '#7F77DD',
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  inviteButtonText: {
    color: '#7F77DD',
    fontSize: 15,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 48,
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
  emptyText: {
    fontSize: 14,
    color: '#999',
  },
});
