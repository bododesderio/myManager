import type { Metadata } from 'next';
import { QueueContent } from './QueueContent';

export const metadata: Metadata = {
  title: 'Admin - Queue',
};

export default function AdminQueuePage() {
  return <QueueContent />;
}
