import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { styles } from './preview.styles';
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
