import type { Metadata } from 'next';
import NotificationsContent from './NotificationsContent';

export const metadata: Metadata = {
  title: 'Notification Settings',
};

export default function NotificationsSettingsPage() {
  return <NotificationsContent />;
}
