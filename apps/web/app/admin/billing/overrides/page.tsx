import type { Metadata } from 'next';
import { OverridesContent } from './OverridesContent';

export const metadata: Metadata = {
  title: 'Admin - Billing Overrides',
};

export default function AdminBillingOverridesPage() {
  return <OverridesContent />;
}
