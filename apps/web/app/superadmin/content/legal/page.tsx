import type { Metadata } from 'next';
import { LegalContent } from './LegalContent';

export const metadata: Metadata = {
  title: 'Admin - Legal Content',
};

export default function AdminContentLegalPage() {
  return <LegalContent />;
}
