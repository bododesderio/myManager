import type { Metadata } from 'next';
import { SystemSettingsContent } from './SystemSettingsContent';

export const metadata: Metadata = {
  title: 'Admin - System Settings',
};

export default function AdminSettingsPage() {
  return <SystemSettingsContent />;
}
