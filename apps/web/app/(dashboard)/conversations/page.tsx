import type { Metadata } from 'next';
import { ConversationsContent } from './ConversationsContent';

export const metadata: Metadata = {
  title: 'Conversations',
};

export default function ConversationsPage() {
  return <ConversationsContent />;
}
