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
  list: { padding: 16 },
  languageRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 8,
  },
  languageRowSelected: { borderWidth: 2, borderColor: colors.primary },
  languageName: { fontSize: 16, fontWeight: '500', color: '#1a1a1a' },
  nativeName: { fontSize: 13, color: '#999', marginTop: 2 },
  checkmark: { fontSize: 20, fontWeight: '700', color: colors.primary },
});
