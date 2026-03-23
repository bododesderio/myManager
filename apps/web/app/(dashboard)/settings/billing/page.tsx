import type { Metadata } from 'next';
import BillingContent from './BillingContent';

export const metadata: Metadata = {
  title: 'Billing',
};

export default function BillingSettingsPage() {
  return <BillingContent />;
}
