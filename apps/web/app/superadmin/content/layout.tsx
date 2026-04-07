import type { Metadata } from 'next';
import { ContentLayout } from './ContentLayout';

export const metadata: Metadata = {
  title: 'Admin - Content',
};

export default function AdminContentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ContentLayout>{children}</ContentLayout>;
}
