import type { Metadata } from 'next';
import { BlogListContent } from './BlogListContent';

export const metadata: Metadata = {
  title: 'Admin - Blog Posts',
};

export default function AdminBlogPage() {
  return <BlogListContent />;
}
