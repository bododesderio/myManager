import type { Metadata } from 'next';
import { BlogEditorContent } from '../BlogEditorContent';

export const metadata: Metadata = {
  title: 'Admin - New Blog Post',
};

export default function AdminNewBlogPostPage() {
  return <BlogEditorContent />;
}
