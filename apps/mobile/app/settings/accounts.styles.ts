import { colors } from '@/theme/colors';
import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 16, backgroundColor: '#fff',
    borderBottomWidth: 1, borderBottomColor: '#eee',
  },
  backText: { fontSize: 16, color: colors.primary, fontWeight: '600' },
  title: { fontSize: 18, fontWeight: '600', color: '#1a1a1a' },
  refreshText: { fontSize: 14, color: colors.primary, fontWeight: '600' },
  content: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  errorText: { color: '#F44336', marginBottom: 8 },
  retryText: { color: colors.primary, fontWeight: '600' },
  accountRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: '#fff', paddingHorizontal: 20, paddingVertical: 16,
    borderBottomWidth: 1, borderBottomColor: '#f0f0f0',
  },
  accountInfo: { flex: 1 },
  platformName: { fontSize: 16, fontWeight: '500', color: '#1a1a1a' },
  accountName: { fontSize: 13, color: '#999', marginTop: 2 },
  connectButton: { backgroundColor: colors.primary, borderRadius: 8, paddingHorizontal: 16, paddingVertical: 8 },
  disconnectButton: { backgroundColor: 'transparent', borderWidth: 1, borderColor: '#F44336' },
  connectButtonText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  disconnectButtonText: { color: '#F44336' },
});
