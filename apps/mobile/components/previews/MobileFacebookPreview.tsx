import { View, Text, StyleSheet, Image } from 'react-native';

interface MobileFacebookPreviewProps {
  pageName: string;
  content: string;
  imageUri?: string;
}

export default function MobileFacebookPreview({ pageName, content, imageUri }: MobileFacebookPreviewProps) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{pageName[0] || 'P'}</Text>
        </View>
        <View>
          <Text style={styles.pageName}>{pageName}</Text>
          <Text style={styles.timestamp}>Just now - Public</Text>
        </View>
      </View>

      <Text style={styles.content}>{content || 'Your post content...'}</Text>

      {imageUri ? (
        <Image source={{ uri: imageUri }} style={styles.image} resizeMode="cover" />
      ) : (
        <View style={styles.imagePlaceholder}>
          <Text style={styles.placeholderText}>Image preview</Text>
        </View>
      )}

      <View style={styles.engagementBar}>
        <Text style={styles.engagementText}>Like</Text>
        <Text style={styles.engagementText}>Comment</Text>
        <Text style={styles.engagementText}>Share</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 8,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1877F2',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  avatarText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  pageName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  timestamp: {
    fontSize: 12,
    color: '#999',
  },
  content: {
    paddingHorizontal: 12,
    paddingBottom: 12,
    fontSize: 14,
    lineHeight: 20,
    color: '#1a1a1a',
  },
  image: {
    width: '100%',
    height: 200,
  },
  imagePlaceholder: {
    width: '100%',
    height: 200,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: {
    color: '#999',
    fontSize: 14,
  },
  engagementBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  engagementText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
  },
});
