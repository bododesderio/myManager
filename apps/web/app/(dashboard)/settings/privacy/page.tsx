import type { Metadata } from 'next';
import PrivacyContent from './PrivacyContent';

export const metadata: Metadata = {
  title: 'Privacy Settings',
};

export default function PrivacySettingsPage() {
  return <PrivacyContent />;
}
