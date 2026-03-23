import type { Metadata } from 'next';
import PortalContent from './PortalContent';

interface PortalPageProps {
  params: Promise<{ token: string }>;
}

export async function generateMetadata({ params }: PortalPageProps): Promise<Metadata> {
  await params;
  return {
    title: 'Client Portal',
    description: 'Review and approve scheduled content.',
  };
}

export default async function PortalPage({ params }: PortalPageProps) {
  const { token } = await params;
  return <PortalContent token={token} />;
}
