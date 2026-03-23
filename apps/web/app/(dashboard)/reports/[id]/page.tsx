import type { Metadata } from 'next';
import { ReportDetailContent } from './ReportDetailContent';

interface ReportDetailPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: ReportDetailPageProps): Promise<Metadata> {
  const { id } = await params;
  return { title: `Report #${id}` };
}

export default async function ReportDetailPage({ params }: ReportDetailPageProps) {
  const { id } = await params;
  return <ReportDetailContent id={id} />;
}
