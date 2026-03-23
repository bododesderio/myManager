import type { Metadata } from 'next';
import { ContentPagesContent } from './ContentPagesContent';

export const metadata: Metadata = {
  title: 'Admin - Content Pages',
};

export default function AdminContentPagesPage() {
  return <ContentPagesContent />;
}
