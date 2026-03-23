import type { Metadata } from 'next';
import { PlatformAnalyticsContent } from './PlatformAnalyticsContent';

interface PlatformAnalyticsPageProps {
  params: Promise<{ platform: string }>;
}

export async function generateMetadata({ params }: PlatformAnalyticsPageProps): Promise<Metadata> {
  const { platform } = await params;
  const name = platform.charAt(0).toUpperCase() + platform.slice(1);
  return { title: `${name} Analytics` };
}

export default async function PlatformAnalyticsPage({ params }: PlatformAnalyticsPageProps) {
  const { platform } = await params;
  return <PlatformAnalyticsContent platform={platform} />;
}
