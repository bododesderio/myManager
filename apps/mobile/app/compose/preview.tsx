import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';

type PreviewPlatform = 'facebook' | 'instagram' | 'twitter' | 'linkedin';

export default function PreviewScreen() {
  const [activePlatform, setActivePlatform] = useState<PreviewPlatform>('facebook');

  const platforms: { key: PreviewPlatform; label: string }[] = [
    { key: 'facebook', label: 'Facebook' },
    { key: 'instagram', label: 'Instagram' },
    { key: 'twitter', label: 'Twitter' },
    { key: 'linkedin', label: 'LinkedIn' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Preview</Text>
        <TouchableOpacity>
          <Text style={styles.publishText}>Publish</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.platformTabs}>
        {platforms.map((p) => (
          <TouchableOpacity
            key={p.key}
            style={[styles.platformTab, activePlatform === p.key && styles.platformTabActive]}
            onPress={() => setActivePlatform(p.key)}
          >
            <Text style={[styles.platformTabText, activePlatform === p.key && styles.platformTabTextActive]}>
              {p.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={styles.previewArea}>
        <View style={styles.previewCard}>
          <View style={styles.previewHeader}>
            <View style={styles.previewAvatar}>
              <Text style={styles.previewAvatarText}>U</Text>
            </View>
            <View>
              <Text style={styles.previewName}>Your Page Name</Text>
              <Text style={styles.previewTime}>Just now</Text>
            </View>
          </View>
          <Text style={styles.previewContent}>
            Your post content will appear here...
          </Text>
          <View style={styles.previewImagePlaceholder}>
            <Text style={styles.placeholderText}>Media Preview</Text>
          </View>
        </View>
      </ScrollView>
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
  publishText: {
    fontSize: 16,
    color: '#7F77DD',
    fontWeight: '600',
  },
  platformTabs: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  platformTab: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#f0f0f0',
  },
  platformTabActive: {
    backgroundColor: '#7F77DD',
  },
  platformTabText: {
    fontSize: 13,
    color: '#666',
  },
  platformTabTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  previewArea: {
    flex: 1,
    padding: 16,
  },
  previewCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  previewAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#7F77DD',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  previewAvatarText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  previewName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  previewTime: {
    fontSize: 12,
    color: '#999',
  },
  previewContent: {
    fontSize: 15,
    color: '#333',
    lineHeight: 22,
    marginBottom: 12,
  },
  previewImagePlaceholder: {
    height: 200,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: {
    fontSize: 14,
    color: '#999',
  },
});
