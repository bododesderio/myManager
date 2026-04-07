import { colors } from '@/theme/colors';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Pressable } from 'react-native';

interface ActionSheetOption {
  label: string;
  onPress: () => void;
  destructive?: boolean;
}

interface ActionSheetProps {
  visible: boolean;
  title?: string;
  options: ActionSheetOption[];
  onClose: () => void;
}

export default function ActionSheet({ visible, title, options, onClose }: ActionSheetProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <View style={styles.sheet}>
          {title && <Text style={styles.title}>{title}</Text>}
          {options.map((option, index) => (
            <TouchableOpacity
              key={index}
              style={[styles.option, index < options.length - 1 && styles.optionBorder]}
              onPress={() => {
                option.onPress();
                onClose();
              }}
            >
              <Text
                style={[
                  styles.optionText,
                  option.destructive && styles.destructiveText,
                ]}
              >
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 8,
    paddingBottom: 32,
    paddingHorizontal: 16,
  },
  title: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  option: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  optionBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  optionText: {
    fontSize: 18,
    color: colors.primary,
    fontWeight: '500',
  },
  destructiveText: {
    color: '#F44336',
  },
  cancelButton: {
    marginTop: 8,
    paddingVertical: 16,
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
  },
  cancelText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
  },
});
