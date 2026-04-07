import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import { styles } from './new.styles';
import { router } from 'expo-router';
import { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { useCreatePost, useSchedulePost } from '@/hooks/usePosts';
import { useUploadMedia } from '@/hooks/useMedia';
import { useWorkspaceStore } from '@/store/workspaceStore';

interface UploadedMedia {
  id: string;
  uri: string;
  filename: string;
}

export default function NewComposeScreen() {
  const [content, setContent] = useState('');
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [scheduledAt, setScheduledAt] = useState<string | null>(null);
  const [showScheduleInput, setShowScheduleInput] = useState(false);

  const [uploadedMedia, setUploadedMedia] = useState<UploadedMedia[]>([]);

  const currentWorkspace = useWorkspaceStore((s) => s.currentWorkspace);
  const createPost = useCreatePost();
  const schedulePost = useSchedulePost();
  const uploadMedia = useUploadMedia();

  const isMutating = createPost.isPending || schedulePost.isPending || uploadMedia.isPending;

  async function pickFromLibrary() {
    if (!currentWorkspace) {
      Alert.alert('No workspace', 'Select a workspace first.');
      return;
    }
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (perm.status !== 'granted') {
      Alert.alert('Permission needed', 'Allow photo library access to attach media.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsMultipleSelection: true,
      quality: 0.85,
    });
    if (result.canceled) return;
    await uploadAssets(result.assets);
  }

  async function captureFromCamera() {
    if (!currentWorkspace) {
      Alert.alert('No workspace', 'Select a workspace first.');
      return;
    }
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (perm.status !== 'granted') {
      Alert.alert('Permission needed', 'Allow camera access to capture media.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ quality: 0.85 });
    if (result.canceled) return;
    await uploadAssets(result.assets);
  }

  async function uploadAssets(assets: ImagePicker.ImagePickerAsset[]) {
    if (!currentWorkspace) return;
    for (const asset of assets) {
      try {
        const filename = asset.fileName ?? asset.uri.split('/').pop() ?? `media-${Date.now()}`;
        const mimeType =
          asset.mimeType ?? (asset.type === 'video' ? 'video/mp4' : 'image/jpeg');
        const result: any = await uploadMedia.mutateAsync({
          uri: asset.uri,
          filename,
          mimeType,
          workspaceId: currentWorkspace.id,
        });
        const media = result?.media ?? result;
        if (media?.id) {
          setUploadedMedia((prev) => [
            ...prev,
            { id: media.id, uri: media.url ?? asset.uri, filename },
          ]);
        }
      } catch (err: any) {
        Alert.alert('Upload failed', err?.message ?? `Failed to upload ${asset.fileName}`);
      }
    }
  }

  function removeMedia(id: string) {
    setUploadedMedia((prev) => prev.filter((m) => m.id !== id));
  }

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
        mediaUrls: uploadedMedia.map((m) => m.id),
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
        mediaUrls: uploadedMedia.map((m) => m.id),
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
        mediaUrls: uploadedMedia.map((m) => m.id),
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
            <TouchableOpacity style={styles.mediaButton} onPress={captureFromCamera} disabled={isMutating}>
              <Text style={styles.mediaButtonIcon}>📷</Text>
              <Text style={styles.mediaButtonText}>Camera</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.mediaButton} onPress={pickFromLibrary} disabled={isMutating}>
              <Text style={styles.mediaButtonIcon}>🖼️</Text>
              <Text style={styles.mediaButtonText}>Gallery</Text>
            </TouchableOpacity>
          </View>
          {uploadMedia.isPending && (
            <View style={styles.uploadingRow}>
              <ActivityIndicator size="small" color="#7F77DD" />
              <Text style={styles.uploadingText}>Uploading…</Text>
            </View>
          )}
          {uploadedMedia.length > 0 && (
            <ScrollView horizontal style={styles.mediaPreview} showsHorizontalScrollIndicator={false}>
              {uploadedMedia.map((m) => (
                <View key={m.id} style={styles.mediaThumb}>
                  <Image source={{ uri: m.uri }} style={styles.mediaImage} />
                  <TouchableOpacity style={styles.removeMediaBtn} onPress={() => removeMedia(m.id)}>
                    <Text style={styles.removeMediaText}>×</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          )}
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
