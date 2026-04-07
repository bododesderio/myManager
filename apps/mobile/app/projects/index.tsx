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
import { useProjects, useCreateProject, type Project } from '@/hooks/useProjects';
import { useWorkspaceStore } from '@/store/workspaceStore';

export default function ProjectsScreen() {
  const workspaceId = useWorkspaceStore((s) => s.currentWorkspace?.id ?? null);
  const { data, isLoading, isError, error, refetch } = useProjects(workspaceId);
  const createProject = useCreateProject();

  const projects: Project[] = (data as any) ?? [];

  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');

  function handleCreate() {
    if (!newName.trim()) {
      Alert.alert('Required', 'Project name is required.');
      return;
    }
    if (!workspaceId) return;
    createProject.mutate(
      { workspaceId, name: newName.trim(), description: newDesc.trim() || undefined },
      {
        onSuccess: () => {
          setShowCreate(false);
          setNewName('');
          setNewDesc('');
        },
        onError: (e: any) => Alert.alert('Failed', e?.message ?? 'Could not create project'),
      },
    );
  }

  const renderItem = ({ item }: { item: Project }) => (
    <TouchableOpacity style={styles.card} onPress={() => router.push(`/projects/${item.id}` as any)}>
      <Text style={styles.cardTitle}>{item.name}</Text>
      {!!item.description && <Text style={styles.cardDescription}>{item.description}</Text>}
      {item.status && <Text style={styles.cardStat}>Status: {item.status}</Text>}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Projects</Text>
        <TouchableOpacity onPress={() => setShowCreate(true)}>
          <Text style={styles.addText}>+ New</Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={styles.emptyState}>
          <ActivityIndicator size="large" color="#7F77DD" />
        </View>
      ) : isError ? (
        <View style={styles.emptyState}>
          <Text style={styles.errorText}>{(error as Error)?.message ?? 'Failed to load'}</Text>
          <TouchableOpacity onPress={() => refetch()}>
            <Text style={styles.retryText}>Tap to retry</Text>
          </TouchableOpacity>
        </View>
      ) : projects.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>No Projects</Text>
          <Text style={styles.emptyText}>Create projects to organize your content workflow</Text>
          <TouchableOpacity style={styles.createButton} onPress={() => setShowCreate(true)}>
            <Text style={styles.createButtonText}>Create Project</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={projects}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
        />
      )}

      <Modal visible={showCreate} animationType="slide" transparent onRequestClose={() => setShowCreate(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>New Project</Text>
            <Text style={styles.label}>Name *</Text>
            <TextInput
              style={styles.input}
              value={newName}
              onChangeText={setNewName}
              placeholder="Acme Q2 Campaign"
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
                disabled={createProject.isPending}
              >
                <Text style={styles.saveText}>
                  {createProject.isPending ? 'Creating…' : 'Create'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
