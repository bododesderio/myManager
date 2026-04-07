import type { Metadata } from 'next';
import { BillingContent } from './BillingContent';

export const metadata: Metadata = {
  title: 'Admin - Billing',
};

export default function AdminBillingPage() {
  return <BillingContent />;
}
