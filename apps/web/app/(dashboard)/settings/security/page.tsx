import type { Metadata } from 'next';
import SecurityContent from './SecurityContent';

export const metadata: Metadata = {
  title: 'Security Settings',
};

export default function SecuritySettingsPage() {
  return <SecurityContent />;
}
