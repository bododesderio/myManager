import type { Metadata } from 'next';
import { ApprovalsContent } from './ApprovalsContent';

export const metadata: Metadata = {
  title: 'Approvals',
};

export default function ApprovalsPage() {
  return <ApprovalsContent />;
}
