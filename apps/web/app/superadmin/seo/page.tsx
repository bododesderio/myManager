import type { Metadata } from 'next';
import { SeoContent } from './SeoContent';

export const metadata: Metadata = {
  title: 'Admin - SEO',
};

export default function AdminSeoPage() {
  return <SeoContent />;
}
