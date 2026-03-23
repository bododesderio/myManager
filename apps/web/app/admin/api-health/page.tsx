import type { Metadata } from 'next';
import { ApiHealthContent } from './ApiHealthContent';

export const metadata: Metadata = {
  title: 'Admin - API Health',
};

export default function AdminApiHealthPage() {
  return <ApiHealthContent />;
}
