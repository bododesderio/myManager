import type { Metadata } from 'next';
import IntegrationsContent from './IntegrationsContent';

export const metadata: Metadata = {
  title: 'Integrations',
};

export default function IntegrationsSettingsPage() {
  return <IntegrationsContent />;
}
