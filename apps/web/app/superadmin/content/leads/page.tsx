import type { Metadata } from 'next';
import { LeadsContent } from './LeadsContent';

export const metadata: Metadata = {
  title: 'Admin - Contact Leads',
};

export default function AdminLeadsPage() {
  return <LeadsContent />;
}
