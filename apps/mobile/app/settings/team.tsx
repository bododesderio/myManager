import { colors } from '@/theme/colors';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { styles } from './team.styles';
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

  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'admin' | 'editor' | 'viewer'>('editor');
  const [inviting, setInviting] = useState(false);

  async function sendInvite() {
    if (!currentWorkspace?.id) return;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(inviteEmail)) {
      Alert.alert('Invalid email', 'Enter a valid email address.');
      return;
    }
    try {
      setInviting(true);
      await apiClient.post(`/workspaces/${currentWorkspace.id}/members/invite`, {
        email: inviteEmail.trim().toLowerCase(),
        role: inviteRole,
      });
      Alert.alert('Invitation sent', `Invited ${inviteEmail}.`);
      setShowInvite(false);
      setInviteEmail('');
      setInviteRole('editor');
      fetchMembers();
    } catch (err: any) {
      Alert.alert('Failed', err?.message ?? 'Could not send invitation');
    } finally {
      setInviting(false);
    }
  }

  const fetchMembers = useCallback(async () => {
    if (!currentWorkspace?.id) {
      setLoading(false);
      return;
    }
    try {
      setError(null);
      setLoading(true);
      const data = await apiClient.get<{ members: TeamMember[] }>(
        `/workspaces/${currentWorkspace.id}/members`
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
        <TouchableOpacity onPress={() => setShowInvite(true)}>
          <Text style={styles.inviteText}>Invite</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color=colors.primary />
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
            <TouchableOpacity style={styles.inviteButton} onPress={() => setShowInvite(true)}>
              <Text style={styles.inviteButtonText}>+ Invite Team Member</Text>
            </TouchableOpacity>
          }
          contentContainerStyle={styles.list}
        />
      )}

      <Modal visible={showInvite} transparent animationType="slide" onRequestClose={() => setShowInvite(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Invite Team Member</Text>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              value={inviteEmail}
              onChangeText={setInviteEmail}
              placeholder="colleague@company.com"
              keyboardType="email-address"
              autoCapitalize="none"
              autoFocus
            />
            <Text style={styles.label}>Role</Text>
            <View style={styles.roleRow}>
              {(['admin', 'editor', 'viewer'] as const).map((r) => (
                <TouchableOpacity
                  key={r}
                  style={[styles.rolePill, inviteRole === r && styles.rolePillActive]}
                  onPress={() => setInviteRole(r)}
                >
                  <Text style={[styles.rolePillText, inviteRole === r && styles.rolePillTextActive]}>
                    {r}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowInvite(false)}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={sendInvite} disabled={inviting}>
                <Text style={styles.saveText}>{inviting ? 'Sending…' : 'Send Invite'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
