import type { Metadata } from 'next';
import { PageEditorContent } from './PageEditorContent';

export const metadata: Metadata = {
  title: 'Admin - Page Editor',
};

export default async function AdminPageEditorPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <PageEditorContent slug={slug} />;
}
