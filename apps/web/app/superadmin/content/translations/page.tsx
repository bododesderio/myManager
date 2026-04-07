import type { Metadata } from 'next';
import { TranslationsContent } from './TranslationsContent';

export const metadata: Metadata = {
  title: 'Admin - Translations',
};

export default function AdminContentTranslationsPage() {
  return <TranslationsContent />;
}
