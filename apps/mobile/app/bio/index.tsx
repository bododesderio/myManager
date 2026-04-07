import { View, Text, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Alert } from 'react-native';
import { styles } from './index.styles';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiClient } from '@/services/apiClient';
import { useWorkspaceStore } from '@/store/workspaceStore';

interface BioLink {
  id?: string;
  title: string;
  url: string;
  active?: boolean;
}

interface BioPage {
  id: string;
  slug: string;
  title: string;
  description?: string;
  links: BioLink[];
}

export default function BioScreen() {
  const workspaceId = useWorkspaceStore((s) => s.currentWorkspace?.id ?? null);

  const { data, isLoading } = useQuery({
    queryKey: ['bio-pages', workspaceId],
    queryFn: () =>
      apiClient.get<BioPage[] | { pages?: BioPage[] }>('/bio-pages', {
        params: { workspaceId: workspaceId! },
      }),
    enabled: !!workspaceId,
  });

  const pages: BioPage[] = (data as any)?.pages ?? (data as any) ?? [];
  const existing = pages[0];

  const [bioTitle, setBioTitle] = useState('');
  const [bioDescription, setBioDescription] = useState('');
  const [links, setLinks] = useState<BioLink[]>([]);

  useEffect(() => {
    if (existing) {
      setBioTitle(existing.title ?? '');
      setBioDescription(existing.description ?? '');
      setLinks(existing.links ?? []);
    }
  }, [existing]);

  const save = useMutation({
    mutationFn: async () => {
      if (!workspaceId) throw new Error('No workspace selected');
      if (existing) {
        return apiClient.put(`/bio-pages/${existing.id}`, {
          title: bioTitle,
          description: bioDescription,
          links,
        });
      }
      return apiClient.post('/bio-pages', {
        workspaceId,
        slug: bioTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 40) || 'my-bio',
        title: bioTitle,
        description: bioDescription,
        links,
      });
    },
    onSuccess: () => Alert.alert('Saved', 'Bio page saved.'),
    onError: (e: any) => Alert.alert('Failed', e?.message ?? 'Could not save'),
  });

  function addLink() {
    setLinks((prev) => [...prev, { title: '', url: '', active: true }]);
  }

  function updateLink(index: number, patch: Partial<BioLink>) {
    setLinks((prev) => prev.map((l, i) => (i === index ? { ...l, ...patch } : l)));
  }

  function removeLink(index: number) {
    setLinks((prev) => prev.filter((_, i) => i !== index));
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Bio Link</Text>
        <TouchableOpacity onPress={() => save.mutate()} disabled={save.isPending || !bioTitle.trim()}>
          <Text style={[styles.saveText, (!bioTitle.trim() || save.isPending) && { opacity: 0.5 }]}>
            {save.isPending ? '…' : 'Save'}
          </Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color="#7F77DD" />
        </View>
      ) : (
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
              <TouchableOpacity onPress={addLink}>
                <Text style={styles.addLinkText}>+ Add Link</Text>
              </TouchableOpacity>
            </View>

            {links.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>Add links to create your bio page</Text>
              </View>
            ) : (
              links.map((link, i) => (
                <View key={i} style={styles.linkCard}>
                  <TextInput
                    style={styles.linkInput}
                    placeholder="Title"
                    value={link.title}
                    onChangeText={(t) => updateLink(i, { title: t })}
                  />
                  <TextInput
                    style={styles.linkInput}
                    placeholder="https://…"
                    value={link.url}
                    onChangeText={(t) => updateLink(i, { url: t })}
                    autoCapitalize="none"
                    keyboardType="url"
                  />
                  <TouchableOpacity onPress={() => removeLink(i)}>
                    <Text style={styles.removeLinkText}>Remove</Text>
                  </TouchableOpacity>
                </View>
              ))
            )}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Preview</Text>
            <View style={styles.previewContainer}>
              <View style={styles.previewAvatar}>
                <Text style={styles.previewAvatarText}>
                  {bioTitle ? bioTitle[0].toUpperCase() : 'U'}
                </Text>
              </View>
              <Text style={styles.previewTitle}>{bioTitle || 'Your Page Title'}</Text>
              <Text style={styles.previewDescription}>{bioDescription || 'Your bio description'}</Text>
              {links.filter((l) => l.url).map((l, i) => (
                <View key={i} style={styles.previewLinkPill}>
                  <Text style={styles.previewLinkText}>{l.title || l.url}</Text>
                </View>
              ))}
            </View>
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
