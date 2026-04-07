import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  cancelText: {
    fontSize: 16,
    color: '#999',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  nextText: {
    fontSize: 16,
    color: '#7F77DD',
    fontWeight: '600',
  },
  scrollContent: {
    flex: 1,
    padding: 20,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
    marginTop: 16,
  },
  platformRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  platformChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
  },
  platformChipActive: {
    backgroundColor: '#7F77DD',
  },
  platformChipText: {
    fontSize: 13,
    color: '#666',
  },
  platformChipTextActive: {
    color: '#fff',
  },
  textArea: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    minHeight: 160,
    backgroundColor: '#f9f9f9',
  },
  charCount: {
    fontSize: 12,
    color: '#999',
    textAlign: 'right',
    marginTop: 4,
  },
  mediaSection: {
    marginTop: 8,
  },
  mediaButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  mediaButton: {
    flex: 1,
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#eee',
    borderStyle: 'dashed',
  },
  mediaButtonIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  mediaButtonText: {
    fontSize: 12,
    color: '#666',
  },
  scheduleSection: {
    marginTop: 20,
  },
  scheduleToggle: {
    paddingVertical: 10,
  },
  scheduleToggleText: {
    fontSize: 14,
    color: '#7F77DD',
    fontWeight: '500',
  },
  scheduleInputContainer: {
    marginTop: 8,
  },
  scheduleHint: {
    fontSize: 12,
    color: '#999',
    marginBottom: 6,
  },
  scheduleInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
    backgroundColor: '#f9f9f9',
    color: '#1a1a1a',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 32,
    marginBottom: 32,
  },
  scheduleButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#7F77DD',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scheduleButtonText: {
    color: '#7F77DD',
    fontSize: 16,
    fontWeight: '600',
  },
  publishButton: {
    flex: 1,
    backgroundColor: '#7F77DD',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  publishButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  disabledButton: {
    borderColor: '#ccc',
  },
  disabledPublishButton: {
    backgroundColor: '#b8b3e8',
  },
  disabledText: {
    color: '#ccc',
  },
  uploadingRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: 8 },
  uploadingText: { fontSize: 13, color: '#7F77DD' },
  mediaPreview: { marginTop: 12 },
  mediaThumb: { marginRight: 8, position: 'relative' },
  mediaImage: { width: 80, height: 80, borderRadius: 8, backgroundColor: '#eee' },
  removeMediaBtn: {
    position: 'absolute', top: -6, right: -6,
    width: 20, height: 20, borderRadius: 10, backgroundColor: '#000',
    alignItems: 'center', justifyContent: 'center',
  },
  removeMediaText: { color: '#fff', fontSize: 14, lineHeight: 16 },
});
