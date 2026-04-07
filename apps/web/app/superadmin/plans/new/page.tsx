import type { Metadata } from 'next';
import { PlanCreateContent } from './PlanCreateContent';

export const metadata: Metadata = {
  title: 'Admin - New Plan',
};

export default function AdminNewPlanPage() {
  return <PlanCreateContent />;
}
