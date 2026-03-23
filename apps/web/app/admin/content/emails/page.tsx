import type { Metadata } from 'next';
import { EmailTemplatesContent } from './EmailTemplatesContent';

export const metadata: Metadata = {
  title: 'Admin - Email Templates',
};

export default function AdminContentEmailsPage() {
  return <EmailTemplatesContent />;
}
