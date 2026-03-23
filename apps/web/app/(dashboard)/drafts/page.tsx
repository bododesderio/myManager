import type { Metadata } from 'next';
import { DraftsContent } from './DraftsContent';

export const metadata: Metadata = {
  title: 'Drafts',
};

export default function DraftsPage() {
  return <DraftsContent />;
}
