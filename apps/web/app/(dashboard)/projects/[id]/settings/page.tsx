import type { Metadata } from 'next';
import { ProjectSettingsContent } from './ProjectSettingsContent';

interface ProjectSettingsPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: ProjectSettingsPageProps): Promise<Metadata> {
  const { id } = await params;
  return { title: `Project #${id} Settings` };
}

export default async function ProjectSettingsPage({ params }: ProjectSettingsPageProps) {
  const { id } = await params;
  return <ProjectSettingsContent id={id} />;
}
