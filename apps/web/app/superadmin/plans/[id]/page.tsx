import type { Metadata } from 'next';
import { PlanEditContent } from './PlanEditContent';

interface AdminPlanDetailPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: AdminPlanDetailPageProps): Promise<Metadata> {
  const { id } = await params;
  return { title: `Admin - Plan #${id}` };
}

export default async function AdminPlanDetailPage({ params }: AdminPlanDetailPageProps) {
  const { id } = await params;
  return <PlanEditContent id={id} />;
}
