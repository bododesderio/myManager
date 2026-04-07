import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { styles } from './[id].styles';
import { useLocalSearchParams, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useProject, useDeleteProject } from '@/hooks/useProjects';

export default function ProjectDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: project, isLoading, isError, error, refetch } = useProject(id!);
  const deleteProject = useDeleteProject();

  function handleDelete() {
    Alert.alert('Delete project', 'This will also remove its association with posts. Continue?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          deleteProject.mutate(id!, {
            onSuccess: () => router.back(),
            onError: (e: any) => Alert.alert('Failed', e?.message ?? 'Could not delete'),
          });
        },
      },
    ]);
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Project</Text>
        <View style={{ width: 50 }} />
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color="#7F77DD" />
        </View>
      ) : isError || !project ? (
        <View style={styles.center}>
          <Text style={styles.errorText}>{(error as Error)?.message ?? 'Failed to load project'}</Text>
          <TouchableOpacity onPress={() => refetch()} style={styles.retryBtn}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView style={styles.content}>
          <View style={styles.section}>
            <Text style={styles.projectName}>{project.name}</Text>
            {project.description && <Text style={styles.description}>{project.description}</Text>}
            {project.status && <Text style={styles.meta}>Status: {project.status}</Text>}
          </View>

          <TouchableOpacity
            style={[styles.actionButton, styles.deleteButton]}
            onPress={handleDelete}
            disabled={deleteProject.isPending}
          >
            <Text style={styles.deleteText}>
              {deleteProject.isPending ? 'Deleting…' : 'Delete Project'}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
