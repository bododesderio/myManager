import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 16, backgroundColor: '#fff',
    borderBottomWidth: 1, borderBottomColor: '#eee',
  },
  backText: { fontSize: 16, color: '#7F77DD', fontWeight: '600' },
  headerTitle: { fontSize: 18, fontWeight: '600', color: '#1a1a1a' },
  markAllText: { fontSize: 14, color: '#7F77DD', fontWeight: '600' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  list: { padding: 16 },
  row: {
    flexDirection: 'row', backgroundColor: '#fff', borderRadius: 12,
    padding: 16, marginBottom: 8, alignItems: 'flex-start',
  },
  unreadRow: { backgroundColor: '#F3F2FF' },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#7F77DD', marginTop: 6, marginRight: 12 },
  title: { fontSize: 15, fontWeight: '500', color: '#1a1a1a' },
  titleUnread: { fontWeight: '700' },
  body: { fontSize: 13, color: '#666', marginTop: 2 },
  time: { fontSize: 11, color: '#999', marginTop: 6 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: '#1a1a1a', marginBottom: 8 },
  emptyBody: { fontSize: 14, color: '#999', textAlign: 'center' },
  errorText: { color: '#F44336', marginBottom: 8 },
  retryText: { color: '#7F77DD', fontWeight: '600' },
});
