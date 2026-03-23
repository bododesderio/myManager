import type { Metadata } from 'next';
import { ReportsContent } from './ReportsContent';

export const metadata: Metadata = {
  title: 'Reports',
};

export default function ReportsPage() {
  return <ReportsContent />;
}
