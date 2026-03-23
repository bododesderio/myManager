import type { Metadata } from 'next';
import { ProjectAnalyticsContent } from './ProjectAnalyticsContent';

interface ProjectAnalyticsPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: ProjectAnalyticsPageProps): Promise<Metadata> {
  const { id } = await params;
  return { title: `Project #${id} Analytics` };
}

export default async function ProjectAnalyticsPage({ params }: ProjectAnalyticsPageProps) {
  const { id } = await params;
  return <ProjectAnalyticsContent id={id} />;
}
