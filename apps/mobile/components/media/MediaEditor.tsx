import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

interface MediaEditorProps {
  uri: string;
  type: 'image' | 'video';
  onSave?: (editedUri: string) => void;
  onCancel?: () => void;
}

export default function MediaEditor({ uri, type, onSave, onCancel }: MediaEditorProps) {
  const handleSave = () => {
    // TODO: implement media editing
    onSave?.(uri);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onCancel}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Edit {type === 'image' ? 'Photo' : 'Video'}</Text>
        <TouchableOpacity onPress={handleSave}>
          <Text style={styles.saveText}>Save</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.preview}>
        <Text style={styles.previewText}>
          {type === 'image' ? 'Image' : 'Video'} Editor Preview
        </Text>
        <Text style={styles.previewUri}>{uri}</Text>
      </View>

      <View style={styles.tools}>
        <TouchableOpacity style={styles.toolButton}>
          <Text style={styles.toolIcon}>Crop</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.toolButton}>
          <Text style={styles.toolIcon}>Filter</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.toolButton}>
          <Text style={styles.toolIcon}>Adjust</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.toolButton}>
          <Text style={styles.toolIcon}>Text</Text>
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
  preview: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewText: {
    color: '#fff',
    fontSize: 18,
    marginBottom: 8,
  },
  previewUri: {
    color: '#999',
    fontSize: 12,
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
  },
  toolIcon: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
});
