import type { Metadata } from 'next';
import { CampaignsContent } from './CampaignsContent';

export const metadata: Metadata = {
  title: 'Campaigns',
};

export default function CampaignsPage() {
  return <CampaignsContent />;
}
