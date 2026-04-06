import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCreatePost, useSchedulePost } from '@/hooks/usePosts';
import { useWorkspaceStore } from '@/store/workspaceStore';

export default function NewComposeScreen() {
  const [content, setContent] = useState('');
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [scheduledAt, setScheduledAt] = useState<string | null>(null);
  const [showScheduleInput, setShowScheduleInput] = useState(false);

  const currentWorkspace = useWorkspaceStore((s) => s.currentWorkspace);
  const createPost = useCreatePost();
  const schedulePost = useSchedulePost();

  const isMutating = createPost.isPending || schedulePost.isPending;

  const platforms = ['Facebook', 'Instagram', 'Twitter', 'LinkedIn', 'TikTok'];

  const togglePlatform = (platform: string) => {
    setSelectedPlatforms((prev) =>
      prev.includes(platform) ? prev.filter((p) => p !== platform) : [...prev, platform]
    );
  };

  const validate = (): boolean => {
    if (!content.trim()) {
      Alert.alert('Validation Error', 'Please enter some content for your post.');
      return false;
    }
    if (selectedPlatforms.length === 0) {
      Alert.alert('Validation Error', 'Please select at least one platform.');
      return false;
    }
    if (!currentWorkspace) {
      Alert.alert('Error', 'No workspace selected. Please select a workspace first.');
      return false;
    }
    return true;
  };

  const handlePublishNow = () => {
    if (!validate()) return;

    createPost.mutate(
      {
        content: content.trim(),
        platforms: selectedPlatforms,
        status: 'draft',
        mediaUrls: [],
      },
      {
        onSuccess: () => {
          Alert.alert('Success', 'Your post has been published.', [
            { text: 'OK', onPress: () => router.back() },
          ]);
        },
        onError: (error) => {
          Alert.alert('Error', error.message || 'Failed to publish the post. Please try again.');
        },
      }
    );
  };

  const handleSchedule = () => {
    if (!validate()) return;

    if (!scheduledAt) {
      Alert.alert('Validation Error', 'Please set a date and time for scheduling.');
      return;
    }

    const parsed = new Date(scheduledAt);
    if (isNaN(parsed.getTime())) {
      Alert.alert('Validation Error', 'Invalid date format. Please use ISO format (e.g. 2026-04-10T14:00:00Z).');
      return;
    }

    if (parsed.getTime() <= Date.now()) {
      Alert.alert('Validation Error', 'Scheduled date must be in the future.');
      return;
    }

    schedulePost.mutate(
      {
        content: content.trim(),
        platforms: selectedPlatforms,
        scheduledAt,
        mediaUrls: [],
      },
      {
        onSuccess: () => {
          Alert.alert('Scheduled', 'Your post has been scheduled.', [
            { text: 'OK', onPress: () => router.back() },
          ]);
        },
        onError: (error) => {
          Alert.alert('Error', error.message || 'Failed to schedule the post. Please try again.');
        },
      }
    );
  };

  const handleSaveDraft = () => {
    if (!content.trim()) {
      Alert.alert('Validation Error', 'Please enter some content to save as a draft.');
      return;
    }
    if (!currentWorkspace) {
      Alert.alert('Error', 'No workspace selected. Please select a workspace first.');
      return;
    }

    createPost.mutate(
      {
        content: content.trim(),
        platforms: selectedPlatforms,
        status: 'draft',
        mediaUrls: [],
      },
      {
        onSuccess: () => {
          Alert.alert('Draft Saved', 'Your draft has been saved.', [
            { text: 'OK', onPress: () => router.back() },
          ]);
        },
        onError: (error) => {
          Alert.alert('Error', error.message || 'Failed to save draft. Please try again.');
        },
      }
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} disabled={isMutating}>
          <Text style={[styles.cancelText, isMutating && styles.disabledText]}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.title}>New Post</Text>
        <TouchableOpacity onPress={handleSaveDraft} disabled={isMutating}>
          {createPost.isPending ? (
            <ActivityIndicator size="small" color="#7F77DD" />
          ) : (
            <Text style={[styles.nextText, isMutating && styles.disabledText]}>Save Draft</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollContent}>
        <Text style={styles.sectionLabel}>Platforms</Text>
        <View style={styles.platformRow}>
          {platforms.map((platform) => (
            <TouchableOpacity
              key={platform}
              style={[
                styles.platformChip,
                selectedPlatforms.includes(platform) && styles.platformChipActive,
              ]}
              onPress={() => togglePlatform(platform)}
              disabled={isMutating}
            >
              <Text
                style={[
                  styles.platformChipText,
                  selectedPlatforms.includes(platform) && styles.platformChipTextActive,
                ]}
              >
                {platform}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.sectionLabel}>Content</Text>
        <TextInput
          style={styles.textArea}
          placeholder="What would you like to share?"
          placeholderTextColor="#999"
          value={content}
          onChangeText={setContent}
          multiline
          textAlignVertical="top"
          editable={!isMutating}
        />

        <Text style={styles.charCount}>{content.length} characters</Text>

        <View style={styles.mediaSection}>
          <Text style={styles.sectionLabel}>Media</Text>
          <View style={styles.mediaButtons}>
            <TouchableOpacity style={styles.mediaButton} disabled={isMutating}>
              <Text style={styles.mediaButtonIcon}>📷</Text>
              <Text style={styles.mediaButtonText}>Camera</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.mediaButton} disabled={isMutating}>
              <Text style={styles.mediaButtonIcon}>🖼️</Text>
              <Text style={styles.mediaButtonText}>Gallery</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.mediaButton} disabled={isMutating}>
              <Text style={styles.mediaButtonIcon}>📁</Text>
              <Text style={styles.mediaButtonText}>Files</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.scheduleSection}>
          <TouchableOpacity
            style={styles.scheduleToggle}
            onPress={() => setShowScheduleInput((prev) => !prev)}
            disabled={isMutating}
          >
            <Text style={styles.scheduleToggleText}>
              {showScheduleInput ? 'Hide schedule options' : 'Set schedule date/time'}
            </Text>
          </TouchableOpacity>

          {showScheduleInput && (
            <View style={styles.scheduleInputContainer}>
              <Text style={styles.scheduleHint}>
                Enter ISO date (e.g. 2026-04-10T14:00:00Z)
              </Text>
              <TextInput
                style={styles.scheduleInput}
                placeholder="2026-04-10T14:00:00Z"
                placeholderTextColor="#bbb"
                value={scheduledAt || ''}
                onChangeText={(text) => setScheduledAt(text || null)}
                autoCapitalize="none"
                autoCorrect={false}
                editable={!isMutating}
              />
            </View>
          )}
        </View>

        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.scheduleButton, isMutating && styles.disabledButton]}
            onPress={handleSchedule}
            disabled={isMutating}
          >
            {schedulePost.isPending ? (
              <ActivityIndicator size="small" color="#7F77DD" />
            ) : (
              <Text style={[styles.scheduleButtonText, isMutating && styles.disabledText]}>
                Schedule
              </Text>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.publishButton, isMutating && styles.disabledPublishButton]}
            onPress={handlePublishNow}
            disabled={isMutating}
          >
            {createPost.isPending ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.publishButtonText}>Publish Now</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  cancelText: {
    fontSize: 16,
    color: '#999',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  nextText: {
    fontSize: 16,
    color: '#7F77DD',
    fontWeight: '600',
  },
  scrollContent: {
    flex: 1,
    padding: 20,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
    marginTop: 16,
  },
  platformRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  platformChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
  },
  platformChipActive: {
    backgroundColor: '#7F77DD',
  },
  platformChipText: {
    fontSize: 13,
    color: '#666',
  },
  platformChipTextActive: {
    color: '#fff',
  },
  textArea: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    minHeight: 160,
    backgroundColor: '#f9f9f9',
  },
  charCount: {
    fontSize: 12,
    color: '#999',
    textAlign: 'right',
    marginTop: 4,
  },
  mediaSection: {
    marginTop: 8,
  },
  mediaButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  mediaButton: {
    flex: 1,
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#eee',
    borderStyle: 'dashed',
  },
  mediaButtonIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  mediaButtonText: {
    fontSize: 12,
    color: '#666',
  },
  scheduleSection: {
    marginTop: 20,
  },
  scheduleToggle: {
    paddingVertical: 10,
  },
  scheduleToggleText: {
    fontSize: 14,
    color: '#7F77DD',
    fontWeight: '500',
  },
  scheduleInputContainer: {
    marginTop: 8,
  },
  scheduleHint: {
    fontSize: 12,
    color: '#999',
    marginBottom: 6,
  },
  scheduleInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
    backgroundColor: '#f9f9f9',
    color: '#1a1a1a',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 32,
    marginBottom: 32,
  },
  scheduleButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#7F77DD',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scheduleButtonText: {
    color: '#7F77DD',
    fontSize: 16,
    fontWeight: '600',
  },
  publishButton: {
    flex: 1,
    backgroundColor: '#7F77DD',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  publishButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  disabledButton: {
    borderColor: '#ccc',
  },
  disabledPublishButton: {
    backgroundColor: '#b8b3e8',
  },
  disabledText: {
    color: '#ccc',
  },
});
