import type { Metadata } from 'next';
import { LeadsContent } from './LeadsContent';

export const metadata: Metadata = {
  title: 'Admin - Leads',
};

export default function AdminBillingLeadsPage() {
  return <LeadsContent />;
}
