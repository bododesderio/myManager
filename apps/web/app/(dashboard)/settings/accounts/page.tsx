import type { Metadata } from 'next';
import AccountsContent from './AccountsContent';

export const metadata: Metadata = {
  title: 'Connected Accounts',
};

export default function AccountsSettingsPage() {
  return <AccountsContent />;
}
