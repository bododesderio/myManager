import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Image } from 'expo-image';
import { useState, useCallback } from 'react';
import * as FileSystem from 'expo-file-system';

interface MediaEditorProps {
  uri: string;
  type: 'image' | 'video';
  onSave?: (editedUri: string) => void;
  onCancel?: () => void;
}

type EditAction = 'rotate' | 'crop' | 'none';

export default function MediaEditor({ uri, type, onSave, onCancel }: MediaEditorProps) {
  const [rotation, setRotation] = useState(0);
  const [activeAction, setActiveAction] = useState<EditAction>('none');
  const [isSaving, setIsSaving] = useState(false);

  const handleRotate = useCallback(() => {
    setRotation((prev) => (prev + 90) % 360);
    setActiveAction('rotate');
  }, []);

  const handleSave = useCallback(async () => {
    if (isSaving) return;
    setIsSaving(true);

    try {
      if (rotation === 0) {
        // No edits were made; return the original URI
        onSave?.(uri);
        return;
      }

      // Copy the file to a new location to represent the "edited" version.
      // Full image manipulation (crop, resize, rotate pixels) requires
      // expo-image-manipulator which is not installed. The rotation is applied
      // visually via the transform style. For a persisted rotation, install
      // expo-image-manipulator and use ImageManipulator.manipulateAsync().
      const timestamp = Date.now();
      const editedUri = `${FileSystem.cacheDirectory}edited_${timestamp}.jpg`;
      await FileSystem.copyAsync({ from: uri, to: editedUri });

      onSave?.(editedUri);
    } catch (error) {
      Alert.alert('Error', 'Failed to save the edited image. Please try again.');
    } finally {
      setIsSaving(false);
    }
  }, [uri, rotation, isSaving, onSave]);

  const handleReset = useCallback(() => {
    setRotation(0);
    setActiveAction('none');
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onCancel}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Edit {type === 'image' ? 'Photo' : 'Video'}</Text>
        <TouchableOpacity onPress={handleSave} disabled={isSaving}>
          <Text style={[styles.saveText, isSaving && styles.disabledText]}>
            {isSaving ? 'Saving...' : 'Save'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.preview}>
        {type === 'image' ? (
          <Image
            source={{ uri }}
            style={[
              styles.previewImage,
              { transform: [{ rotate: `${rotation}deg` }] },
            ]}
            contentFit="contain"
          />
        ) : (
          <View style={styles.videoPlaceholder}>
            <Text style={styles.videoText}>Video editing not supported</Text>
          </View>
        )}
      </View>

      {activeAction !== 'none' && (
        <TouchableOpacity style={styles.resetButton} onPress={handleReset}>
          <Text style={styles.resetText}>Reset</Text>
        </TouchableOpacity>
      )}

      <View style={styles.tools}>
        <TouchableOpacity
          style={[styles.toolButton, activeAction === 'rotate' && styles.toolButtonActive]}
          onPress={handleRotate}
        >
          <Text style={styles.toolIcon}>Rotate</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.toolButton, activeAction === 'crop' && styles.toolButtonActive]}
          onPress={() =>
            Alert.alert(
              'Crop',
              'Install expo-image-manipulator for crop support.',
            )
          }
        >
          <Text style={styles.toolIcon}>Crop</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.toolButton}
          onPress={() =>
            Alert.alert(
              'Resize',
              'Install expo-image-manipulator for resize support.',
            )
          }
        >
          <Text style={styles.toolIcon}>Resize</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'rgba(0,0,0,0.8)',
  },
  cancelText: {
    fontSize: 16,
    color: '#fff',
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
    color: '#fff',
  },
  saveText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#7F77DD',
  },
  disabledText: {
    opacity: 0.5,
  },
  preview: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  videoPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoText: {
    color: '#999',
    fontSize: 16,
  },
  resetButton: {
    alignSelf: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginBottom: 8,
  },
  resetText: {
    color: '#7F77DD',
    fontSize: 14,
    fontWeight: '500',
  },
  tools: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 20,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(0,0,0,0.8)',
  },
  toolButton: {
    alignItems: 'center',
    padding: 8,
    borderRadius: 8,
  },
  toolButtonActive: {
    backgroundColor: 'rgba(127,119,221,0.3)',
  },
  toolIcon: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
});
