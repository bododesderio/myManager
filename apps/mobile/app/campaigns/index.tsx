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
import { styles } from './index.styles';
import { router } from 'expo-router';
import { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCampaigns, useCreateCampaign, type Campaign } from '@/hooks/useCampaigns';
import { useWorkspaceStore } from '@/store/workspaceStore';

export default function CampaignsScreen() {
  const workspaceId = useWorkspaceStore((s) => s.currentWorkspace?.id ?? null);
  const { data, isLoading, isError, error, refetch } = useCampaigns(workspaceId);
  const createCampaign = useCreateCampaign();

  const campaigns: Campaign[] = (data as any) ?? [];

  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');

  function handleCreate() {
    if (!newName.trim()) {
      Alert.alert('Required', 'Campaign name is required.');
      return;
    }
    if (!workspaceId) return;
    createCampaign.mutate(
      { workspaceId, name: newName.trim(), description: newDesc.trim() || undefined },
      {
        onSuccess: () => {
          setShowCreate(false);
          setNewName('');
          setNewDesc('');
        },
        onError: (e: any) => Alert.alert('Failed', e?.message ?? 'Could not create'),
      },
    );
  }

  const renderItem = ({ item }: { item: Campaign }) => (
    <TouchableOpacity style={styles.card} onPress={() => router.push(`/campaigns/${item.id}` as any)}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>{item.name}</Text>
        {item.status && (
          <View style={[styles.statusBadge, statusBg(item.status)]}>
            <Text style={styles.statusText}>{item.status}</Text>
          </View>
        )}
      </View>
      {(item.start_date || item.end_date) && (
        <Text style={styles.cardMeta}>
          {item.start_date?.slice(0, 10) ?? '?'} → {item.end_date?.slice(0, 10) ?? '?'}
        </Text>
      )}
      {item.description && <Text style={styles.cardDesc}>{item.description}</Text>}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Campaigns</Text>
        <TouchableOpacity onPress={() => setShowCreate(true)}>
          <Text style={styles.addText}>+ New</Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={styles.emptyState}>
          <ActivityIndicator size="large" color=colors.primary />
        </View>
      ) : isError ? (
        <View style={styles.emptyState}>
          <Text style={styles.errorText}>{(error as Error)?.message ?? 'Failed to load'}</Text>
          <TouchableOpacity onPress={() => refetch()}>
            <Text style={styles.retryText}>Tap to retry</Text>
          </TouchableOpacity>
        </View>
      ) : campaigns.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>No Campaigns</Text>
          <Text style={styles.emptyText}>Organize your posts into campaigns for better tracking</Text>
          <TouchableOpacity style={styles.createButton} onPress={() => setShowCreate(true)}>
            <Text style={styles.createButtonText}>Create Campaign</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList data={campaigns} renderItem={renderItem} keyExtractor={(i) => i.id} contentContainerStyle={styles.list} />
      )}

      <Modal visible={showCreate} animationType="slide" transparent onRequestClose={() => setShowCreate(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>New Campaign</Text>
            <Text style={styles.label}>Name *</Text>
            <TextInput
              style={styles.input}
              value={newName}
              onChangeText={setNewName}
              placeholder="Spring Launch"
              autoFocus
            />
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, { height: 80 }]}
              value={newDesc}
              onChangeText={setNewDesc}
              placeholder="Optional"
              multiline
            />
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowCreate(false)}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.saveBtn}
                onPress={handleCreate}
                disabled={createCampaign.isPending}
              >
                <Text style={styles.saveText}>
                  {createCampaign.isPending ? 'Creating…' : 'Create'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function statusBg(status: string) {
  switch (status.toLowerCase()) {
    case 'active':
      return { backgroundColor: '#E8F5E9' };
    case 'draft':
      return { backgroundColor: '#FFF3E0' };
    case 'completed':
      return { backgroundColor: '#E3F2FD' };
    default:
      return { backgroundColor: '#ECEFF1' };
  }
}
