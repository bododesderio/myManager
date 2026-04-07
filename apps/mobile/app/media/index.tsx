import { colors } from '@/theme/colors';
import { View, Text, TouchableOpacity, FlatList, Dimensions, ActivityIndicator } from 'react-native';
import { styles } from './index.styles';
import { router } from 'expo-router';
import { useState, useEffect, useCallback } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { apiClient } from '@/services/apiClient';

type MediaFilter = 'all' | 'images' | 'videos';

interface MediaItem {
  id: string;
  type: 'image' | 'video';
  uri: string;
  createdAt: string;
}

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

const screenWidth = Dimensions.get('window').width;
const itemSize = (screenWidth - 48 - 8) / 3;

export default function MediaScreen() {
  const [filter, setFilter] = useState<MediaFilter>('all');
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMedia = useCallback(async () => {
    try {
      setError(null);
      setLoading(true);
      const data = await apiClient.get<{ media: MediaItem[] }>('/media');
      setMedia(data.media ?? []);
    } catch (error: unknown) {
      setError(getErrorMessage(error, 'Failed to load media'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMedia();
  }, [fetchMedia]);

  const filteredMedia = media.filter((item) => {
    if (filter === 'all') return true;
    if (filter === 'images') return item.type === 'image';
    if (filter === 'videos') return item.type === 'video';
    return true;
  });

  const renderItem = ({ item }: { item: MediaItem }) => (
    <TouchableOpacity style={[styles.mediaItem, { width: itemSize, height: itemSize }]}>
      <View style={styles.mediaPlaceholder}>
        <Text style={styles.mediaType}>{item.type === 'image' ? '🖼️' : '🎬'}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Media Library</Text>
        <TouchableOpacity>
          <Text style={styles.uploadText}>Upload</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.filterRow}>
        {(['all', 'images', 'videos'] as MediaFilter[]).map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.filterChip, filter === f && styles.filterChipActive]}
            onPress={() => setFilter(f)}
          >
            <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={styles.emptyState}>
          <ActivityIndicator size="large" color=colors.primary />
        </View>
      ) : error ? (
        <View style={styles.emptyState}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={fetchMedia}>
            <Text style={styles.retryText}>Tap to retry</Text>
          </TouchableOpacity>
        </View>
      ) : filteredMedia.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>No Media</Text>
          <Text style={styles.emptyText}>
            Upload images and videos to use in your posts
          </Text>
          <TouchableOpacity style={styles.uploadButton}>
            <Text style={styles.uploadButtonText}>Upload Media</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filteredMedia}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          numColumns={3}
          contentContainerStyle={styles.grid}
          columnWrapperStyle={styles.gridRow}
        />
      )}
    </SafeAreaView>
  );
}
