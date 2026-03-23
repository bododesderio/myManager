import type { Metadata } from 'next';
import { PostDetailContent } from './PostDetailContent';

interface PostDetailPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PostDetailPageProps): Promise<Metadata> {
  const { id } = await params;
  return { title: `Post #${id}` };
}

export default async function PostDetailPage({ params }: PostDetailPageProps) {
  const { id } = await params;
  return <PostDetailContent id={id} />;
}
