import { View, Text, StyleSheet, TouchableOpacity, FlatList, Dimensions } from 'react-native';

interface GalleryPickerProps {
  onSelect?: (uris: string[]) => void;
  onClose?: () => void;
  maxSelection?: number;
}

const screenWidth = Dimensions.get('window').width;
const itemSize = (screenWidth - 6) / 3;

export default function GalleryPicker({ onSelect, onClose, maxSelection = 10 }: GalleryPickerProps) {
  const mockItems: string[] = [];

  const handleDone = () => {
    // TODO: return selected items
    onSelect?.([]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Gallery</Text>
        <TouchableOpacity onPress={handleDone}>
          <Text style={styles.doneText}>Done</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.selectionInfo}>
        Select up to {maxSelection} items
      </Text>

      {mockItems.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>No Photos</Text>
          <Text style={styles.emptyText}>
            Grant photo library access to select images
          </Text>
          <TouchableOpacity style={styles.permissionButton}>
            <Text style={styles.permissionButtonText}>Grant Access</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={mockItems}
          renderItem={({ item: _item }) => (
            <TouchableOpacity style={[styles.gridItem, { width: itemSize, height: itemSize }]}>
              <View style={styles.placeholder} />
            </TouchableOpacity>
          )}
          keyExtractor={(_, index) => String(index)}
          numColumns={3}
        />
      )}
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
  doneText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#7F77DD',
  },
  selectionInfo: {
    fontSize: 13,
    color: '#999',
    textAlign: 'center',
    paddingVertical: 8,
  },
  gridItem: {
    margin: 1,
  },
  placeholder: {
    flex: 1,
    backgroundColor: '#f0f0f0',
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
    backgroundColor: '#7F77DD',
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
