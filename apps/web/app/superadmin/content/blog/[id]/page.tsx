import type { Metadata } from 'next';
import { BlogEditorContent } from '../BlogEditorContent';

export const metadata: Metadata = {
  title: 'Admin - Edit Blog Post',
};

export default async function AdminEditBlogPostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <BlogEditorContent postId={id} />;
}
