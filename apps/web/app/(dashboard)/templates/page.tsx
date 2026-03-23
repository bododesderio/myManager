import type { Metadata } from 'next';
import { TemplatesContent } from './TemplatesContent';

export const metadata: Metadata = {
  title: 'Templates',
};

export default function TemplatesPage() {
  return <TemplatesContent />;
}
