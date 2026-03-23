import type { Metadata } from 'next';
import { CampaignDetailContent } from './CampaignDetailContent';

interface CampaignDetailPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: CampaignDetailPageProps): Promise<Metadata> {
  const { id } = await params;
  return { title: `Campaign #${id}` };
}

export default async function CampaignDetailPage({ params }: CampaignDetailPageProps) {
  const { id } = await params;
  return <CampaignDetailContent id={id} />;
}
