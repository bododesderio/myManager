import type { Metadata } from 'next';
import { NewsletterContent } from './NewsletterContent';

export const metadata: Metadata = {
  title: 'Admin - Newsletter Subscribers',
};

export default function AdminNewsletterPage() {
  return <NewsletterContent />;
}
