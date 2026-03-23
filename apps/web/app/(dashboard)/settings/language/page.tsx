import type { Metadata } from 'next';
import LanguageContent from './LanguageContent';

export const metadata: Metadata = {
  title: 'Language & Region',
};

export default function LanguageSettingsPage() {
  return <LanguageContent />;
}
