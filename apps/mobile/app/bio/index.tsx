import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { router } from 'expo-router';
import { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';

interface BioLink {
  id: string;
  title: string;
  url: string;
  active: boolean;
}

export default function BioScreen() {
  const [links, _setLinks] = useState<BioLink[]>([]);
  const [bioTitle, setBioTitle] = useState('');
  const [bioDescription, setBioDescription] = useState('');

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Bio Link</Text>
        <TouchableOpacity>
          <Text style={styles.saveText}>Save</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Profile</Text>
          <TextInput
            style={styles.input}
            placeholder="Page Title"
            placeholderTextColor="#999"
            value={bioTitle}
            onChangeText={setBioTitle}
          />
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Bio Description"
            placeholderTextColor="#999"
            value={bioDescription}
            onChangeText={setBioDescription}
            multiline
          />
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Links</Text>
            <TouchableOpacity style={styles.addLinkButton}>
              <Text style={styles.addLinkText}>+ Add Link</Text>
            </TouchableOpacity>
          </View>

          {links.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>
                Add links to create your bio page
              </Text>
            </View>
          ) : (
            links.map((link) => (
              <View key={link.id} style={styles.linkCard}>
                <Text style={styles.linkTitle}>{link.title}</Text>
                <Text style={styles.linkUrl}>{link.url}</Text>
              </View>
            ))
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preview</Text>
          <View style={styles.previewContainer}>
            <View style={styles.previewAvatar}>
              <Text style={styles.previewAvatarText}>U</Text>
            </View>
            <Text style={styles.previewTitle}>
              {bioTitle || 'Your Page Title'}
            </Text>
            <Text style={styles.previewDescription}>
              {bioDescription || 'Your bio description'}
            </Text>
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
  saveText: {
    fontSize: 16,
    color: '#7F77DD',
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
    marginBottom: 12,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  addLinkButton: {
    marginBottom: 12,
  },
  addLinkText: {
    color: '#7F77DD',
    fontSize: 14,
    fontWeight: '600',
  },
  linkCard: {
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  linkTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  linkUrl: {
    fontSize: 13,
    color: '#999',
    marginTop: 2,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
  },
  previewContainer: {
    alignItems: 'center',
    paddingVertical: 24,
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
  },
  previewAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#7F77DD',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  previewAvatarText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '700',
  },
  previewTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  previewDescription: {
    fontSize: 14,
    color: '#666',
  },
});
