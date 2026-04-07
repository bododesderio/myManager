import { colors } from '@/theme/colors';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useState, useCallback } from 'react';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';

interface GalleryPickerProps {
  onSelect?: (uris: string[]) => void;
  onClose?: () => void;
  maxSelection?: number;
}

export default function GalleryPicker({ onSelect, onClose, maxSelection = 10 }: GalleryPickerProps) {
  const [selectedUris, setSelectedUris] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const pickImages = useCallback(async () => {
    setIsLoading(true);
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Please grant photo library access to select images.',
        );
        setIsLoading(false);
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsMultipleSelection: true,
        selectionLimit: maxSelection,
        quality: 0.85,
        orderedSelection: true,
      });

      if (!result.canceled && result.assets.length > 0) {
        const uris = result.assets.map((asset) => asset.uri);
        setSelectedUris(uris);
      }
    } catch (error) {
      console.error('Failed to pick images:', error);
      Alert.alert('Error', 'Failed to open the image picker. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [maxSelection]);

  const handleRemove = useCallback((uri: string) => {
    setSelectedUris((prev) => prev.filter((u) => u !== uri));
  }, []);

  const handleDone = useCallback(() => {
    onSelect?.(selectedUris);
  }, [selectedUris, onSelect]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Gallery</Text>
        <TouchableOpacity onPress={handleDone} disabled={selectedUris.length === 0}>
          <Text style={[styles.doneText, selectedUris.length === 0 && styles.doneTextDisabled]}>
            Done{selectedUris.length > 0 ? ` (${selectedUris.length})` : ''}
          </Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.selectionInfo}>
        {selectedUris.length > 0
          ? `${selectedUris.length} of ${maxSelection} selected`
          : `Select up to ${maxSelection} items`}
      </Text>

      {selectedUris.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>No Photos Selected</Text>
          <Text style={styles.emptyText}>
            Tap the button below to choose images from your library
          </Text>
          <TouchableOpacity
            style={styles.permissionButton}
            onPress={pickImages}
            disabled={isLoading}
          >
            <Text style={styles.permissionButtonText}>
              {isLoading ? 'Opening...' : 'Choose Photos'}
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.selectedContainer}>
          <View style={styles.grid}>
            {selectedUris.map((uri) => (
              <View key={uri} style={styles.gridItem}>
                <Image source={{ uri }} style={styles.thumbnail} contentFit="cover" />
                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={() => handleRemove(uri)}
                >
                  <Text style={styles.removeText}>X</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
          {selectedUris.length < maxSelection && (
            <TouchableOpacity
              style={styles.addMoreButton}
              onPress={pickImages}
              disabled={isLoading}
            >
              <Text style={styles.addMoreText}>
                {isLoading ? 'Opening...' : 'Add More Photos'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
}

const GRID_ITEM_SIZE = 110;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  cancelText: {
    fontSize: 16,
    color: '#999',
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  doneText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
  },
  doneTextDisabled: {
    opacity: 0.4,
  },
  selectionInfo: {
    fontSize: 13,
    color: '#999',
    textAlign: 'center',
    paddingVertical: 8,
  },
  selectedContainer: {
    flex: 1,
    paddingHorizontal: 12,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingVertical: 8,
  },
  gridItem: {
    width: GRID_ITEM_SIZE,
    height: GRID_ITEM_SIZE,
    borderRadius: 8,
    overflow: 'hidden',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  removeButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  addMoreButton: {
    alignSelf: 'center',
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 12,
    marginTop: 16,
  },
  addMoreText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginBottom: 24,
  },
  permissionButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  permissionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
