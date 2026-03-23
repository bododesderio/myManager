import type { Metadata } from 'next';
import BrandContent from './BrandContent';

export const metadata: Metadata = {
  title: 'Brand Settings',
};

export default function BrandSettingsPage() {
  return <BrandContent />;
}
