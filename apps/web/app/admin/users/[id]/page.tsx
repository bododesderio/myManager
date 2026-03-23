import type { Metadata } from 'next';
import { UserDetailContent } from './UserDetailContent';

interface AdminUserDetailPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: AdminUserDetailPageProps): Promise<Metadata> {
  const { id } = await params;
  return { title: `Admin - User #${id}` };
}

export default async function AdminUserDetailPage({ params }: AdminUserDetailPageProps) {
  const { id } = await params;
  return <UserDetailContent id={id} />;
}
