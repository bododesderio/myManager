import { colors } from '@/theme/colors';
import { View, Text, TextInput, StyleSheet, TouchableOpacity } from 'react-native';
import { useState } from 'react';

interface MobileComposerProps {
  initialContent?: string;
  onSubmit?: (content: string) => void;
  onCancel?: () => void;
}

export default function MobileComposer({ initialContent = '', onSubmit, onCancel }: MobileComposerProps) {
  const [content, setContent] = useState(initialContent);

  const handleSubmit = () => {
    onSubmit?.(content);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onCancel}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Compose</Text>
        <TouchableOpacity onPress={handleSubmit} disabled={!content.trim()}>
          <Text style={[styles.submitText, !content.trim() && styles.submitDisabled]}>
            Post
          </Text>
        </TouchableOpacity>
      </View>

      <TextInput
        style={styles.input}
        placeholder="What's on your mind?"
        placeholderTextColor="#999"
        value={content}
        onChangeText={setContent}
        multiline
        textAlignVertical="top"
        autoFocus
      />

      <View style={styles.toolbar}>
        <TouchableOpacity style={styles.toolbarButton}>
          <Text style={styles.toolbarIcon}>📷</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.toolbarButton}>
          <Text style={styles.toolbarIcon}>🖼️</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.toolbarButton}>
          <Text style={styles.toolbarIcon}>📍</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.toolbarButton}>
          <Text style={styles.toolbarIcon}>#</Text>
        </TouchableOpacity>
        <View style={styles.charCounter}>
          <Text style={styles.charCountText}>{content.length}</Text>
        </View>
      </View>
    </View>
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
  submitText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
  },
  submitDisabled: {
    opacity: 0.4,
  },
  input: {
    flex: 1,
    padding: 16,
    fontSize: 17,
    lineHeight: 24,
  },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  toolbarButton: {
    padding: 8,
  },
  toolbarIcon: {
    fontSize: 20,
  },
  charCounter: {
    marginLeft: 'auto',
  },
  charCountText: {
    fontSize: 13,
    color: '#999',
  },
});
