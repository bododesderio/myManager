import type { Metadata } from 'next';
import { PlansContent } from './PlansContent';

export const metadata: Metadata = {
  title: 'Admin - Plans',
};

export default function AdminPlansPage() {
  return <PlansContent />;
}
