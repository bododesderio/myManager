import type { Metadata } from 'next';
import { HomeContent } from './HomeContent';

export const metadata: Metadata = {
  title: 'Dashboard',
};

export default function HomePage() {
  return <HomeContent />;
}
