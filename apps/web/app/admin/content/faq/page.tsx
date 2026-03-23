import type { Metadata } from 'next';
import { FaqContent } from './FaqContent';

export const metadata: Metadata = {
  title: 'Admin - FAQ Manager',
};

export default function AdminFaqPage() {
  return <FaqContent />;
}
