import { colors } from '@/theme/colors';
import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
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
  backText: { fontSize: 16, color: colors.primary, fontWeight: '600' },
  title: { fontSize: 18, fontWeight: '600', color: '#1a1a1a' },
  content: { flex: 1, padding: 16 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  section: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 16 },
  projectName: { fontSize: 22, fontWeight: '700', color: '#1a1a1a', marginBottom: 8 },
  description: { fontSize: 15, color: '#444', lineHeight: 22, marginBottom: 12 },
  meta: { fontSize: 13, color: '#777' },
  actionButton: { borderWidth: 1, borderRadius: 12, padding: 14, alignItems: 'center', marginBottom: 16 },
  deleteButton: { borderColor: '#F44336' },
  deleteText: { color: '#F44336', fontSize: 15, fontWeight: '600' },
  errorText: { color: '#F44336', textAlign: 'center', marginBottom: 8 },
  retryBtn: { paddingHorizontal: 16, paddingVertical: 8, backgroundColor: colors.primary, borderRadius: 6 },
  retryText: { color: '#fff', fontWeight: '600' },
});
