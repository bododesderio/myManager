import type { Metadata } from 'next';
import { ProjectDetailContent } from './ProjectDetailContent';

interface ProjectDetailPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: ProjectDetailPageProps): Promise<Metadata> {
  const { id } = await params;
  return { title: `Project #${id}` };
}

export default async function ProjectDetailPage({ params }: ProjectDetailPageProps) {
  const { id } = await params;
  return <ProjectDetailContent id={id} />;
}
