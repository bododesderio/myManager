import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  usePendingApprovals,
  useApprovePost,
  useRejectPost,
  useRequestRevision,
} from '@/hooks/useApprovals';
import { useWorkspaceStore } from '@/store/workspaceStore';

interface ApprovalItem {
  id?: string;
  postId?: string;
  post_id?: string;
  caption?: string;
  title?: string;
  authorName?: string;
  author_name?: string;
  submittedAt?: string;
  submitted_at?: string;
  status?: string;
}

export default function ApprovalsScreen() {
  const workspaceId = useWorkspaceStore((s) => s.currentWorkspace?.id ?? null);
  const { data, isLoading, isError, error, refetch } = usePendingApprovals(workspaceId);
  const approvePost = useApprovePost();
  const rejectPost = useRejectPost();
  const requestRevision = useRequestRevision();

  const approvals: ApprovalItem[] = (data as any) ?? [];

  const [commentPostId, setCommentPostId] = useState<string | null>(null);
  const [commentAction, setCommentAction] = useState<'reject' | 'revision' | null>(null);
  const [comment, setComment] = useState('');

  function handleApprove(postId: string) {
    approvePost.mutate(
      { postId },
      {
        onSuccess: () => Alert.alert('Approved', 'Post has been approved.'),
        onError: (e: any) => Alert.alert('Failed', e?.message ?? 'Could not approve'),
      },
    );
  }

  function openComment(postId: string, action: 'reject' | 'revision') {
    setCommentPostId(postId);
    setCommentAction(action);
    setComment('');
  }

  function submitComment() {
    if (!commentPostId || !commentAction || !comment.trim()) return;
    const fn = commentAction === 'reject' ? rejectPost : requestRevision;
    fn.mutate(
      { postId: commentPostId, comment: comment.trim() },
      {
        onSuccess: () => {
          setCommentPostId(null);
          setCommentAction(null);
          setComment('');
        },
        onError: (e: any) => Alert.alert('Failed', e?.message ?? 'Action failed'),
      },
    );
  }

  const renderItem = ({ item }: { item: ApprovalItem }) => {
    const postId = item.id || item.postId || item.post_id || '';
    const caption = item.caption || item.title || 'Untitled post';
    const author = item.authorName || item.author_name || 'Unknown';
    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle} numberOfLines={2}>
            {caption}
          </Text>
        </View>
        <Text style={styles.cardMeta}>By {author}</Text>
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={[styles.actionBtn, styles.approveBtn]}
            onPress={() => handleApprove(postId)}
            disabled={approvePost.isPending}
          >
            <Text style={styles.approveText}>Approve</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, styles.revisionBtn]}
            onPress={() => openComment(postId, 'revision')}
          >
            <Text style={styles.revisionText}>Revise</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, styles.rejectBtn]}
            onPress={() => openComment(postId, 'reject')}
          >
            <Text style={styles.rejectText}>Reject</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Approvals</Text>
        <View style={{ width: 40 }} />
      </View>

      {isLoading ? (
        <View style={styles.emptyState}>
          <ActivityIndicator size="large" color="#7F77DD" />
        </View>
      ) : isError ? (
        <View style={styles.emptyState}>
          <Text style={styles.errorText}>{(error as Error)?.message ?? 'Failed to load'}</Text>
          <TouchableOpacity onPress={() => refetch()}>
            <Text style={styles.retryText}>Tap to retry</Text>
          </TouchableOpacity>
        </View>
      ) : approvals.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>All caught up!</Text>
          <Text style={styles.emptyText}>No posts pending approval right now.</Text>
        </View>
      ) : (
        <FlatList
          data={approvals}
          renderItem={renderItem}
          keyExtractor={(item) => item.id || item.postId || Math.random().toString()}
          contentContainerStyle={styles.list}
        />
      )}

      <Modal
        visible={!!commentPostId && !!commentAction}
        animationType="slide"
        transparent
        onRequestClose={() => setCommentPostId(null)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>
              {commentAction === 'reject' ? 'Reject Post' : 'Request Revision'}
            </Text>
            <Text style={styles.modalSub}>
              {commentAction === 'reject'
                ? 'Provide a reason for rejecting this post.'
                : 'Describe what changes are needed.'}
            </Text>
            <TextInput
              style={[styles.input, { height: 100 }]}
              value={comment}
              onChangeText={setComment}
              placeholder="Add your comment…"
              multiline
              autoFocus
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => {
                  setCommentPostId(null);
                  setCommentAction(null);
                  setComment('');
                }}
              >
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.saveBtn,
                  commentAction === 'reject' ? { backgroundColor: '#F44336' } : null,
                ]}
                onPress={submitComment}
                disabled={!comment.trim() || rejectPost.isPending || requestRevision.isPending}
              >
                <Text style={styles.saveText}>
                  {commentAction === 'reject' ? 'Reject' : 'Request Revision'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
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
  backText: { fontSize: 16, color: '#7F77DD', fontWeight: '600' },
  title: { fontSize: 18, fontWeight: '600', color: '#1a1a1a' },
  list: { padding: 16 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  cardTitle: { fontSize: 16, fontWeight: '600', color: '#1a1a1a', flex: 1 },
  cardMeta: { fontSize: 13, color: '#999', marginBottom: 12 },
  actionRow: { flexDirection: 'row', gap: 8 },
  actionBtn: { flex: 1, paddingVertical: 10, borderRadius: 8, alignItems: 'center', borderWidth: 1 },
  approveBtn: { backgroundColor: '#10B981', borderColor: '#10B981' },
  approveText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  revisionBtn: { borderColor: '#7F77DD' },
  revisionText: { color: '#7F77DD', fontSize: 13, fontWeight: '600' },
  rejectBtn: { borderColor: '#F44336' },
  rejectText: { color: '#F44336', fontSize: 13, fontWeight: '600' },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: '#1a1a1a', marginBottom: 8 },
  emptyText: { fontSize: 14, color: '#999', textAlign: 'center' },
  errorText: { fontSize: 14, color: '#F44336', textAlign: 'center', marginBottom: 8 },
  retryText: { fontSize: 14, color: '#7F77DD', fontWeight: '600' },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: '#fff', padding: 20, borderTopLeftRadius: 16, borderTopRightRadius: 16 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#1a1a1a', marginBottom: 8 },
  modalSub: { fontSize: 13, color: '#666', marginBottom: 12 },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, textAlignVertical: 'top' },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: 16 },
  cancelBtn: { paddingHorizontal: 16, paddingVertical: 10 },
  cancelText: { color: '#666', fontSize: 14, fontWeight: '600' },
  saveBtn: { backgroundColor: '#7F77DD', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8 },
  saveText: { color: '#fff', fontSize: 14, fontWeight: '600' },
});
