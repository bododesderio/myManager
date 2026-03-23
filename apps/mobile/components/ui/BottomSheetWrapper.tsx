import { View, Text, StyleSheet } from 'react-native';
import { useCallback, useMemo, useRef, type ReactNode } from 'react';
import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';

interface BottomSheetWrapperProps {
  children: ReactNode;
  snapPoints?: string[];
  title?: string;
  onClose?: () => void;
}

export default function BottomSheetWrapper({
  children,
  snapPoints: customSnapPoints,
  title,
  onClose,
}: BottomSheetWrapperProps) {
  const bottomSheetRef = useRef<BottomSheet>(null);

  const snapPoints = useMemo(
    () => customSnapPoints || ['25%', '50%', '75%'],
    [customSnapPoints]
  );

  const handleSheetChanges = useCallback(
    (index: number) => {
      if (index === -1) {
        onClose?.();
      }
    },
    [onClose]
  );

  return (
    <BottomSheet
      ref={bottomSheetRef}
      snapPoints={snapPoints}
      onChange={handleSheetChanges}
      enablePanDownToClose
      backgroundStyle={styles.background}
      handleIndicatorStyle={styles.indicator}
    >
      <BottomSheetView style={styles.contentContainer}>
        {title && (
          <View style={styles.header}>
            <Text style={styles.title}>{title}</Text>
          </View>
        )}
        {children}
      </BottomSheetView>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  background: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  indicator: {
    backgroundColor: '#ddd',
    width: 40,
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  header: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    marginBottom: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    textAlign: 'center',
  },
});
