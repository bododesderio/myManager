import type { Metadata } from 'next';
import { BrandContent } from './BrandContent';

export const metadata: Metadata = {
  title: 'Admin - Brand',
};

export default function AdminBrandPage() {
  return <BrandContent />;
}
