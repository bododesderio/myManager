import type { Metadata } from 'next';
import { BenchmarksContent } from './BenchmarksContent';

export const metadata: Metadata = {
  title: 'Benchmarks',
};

export default function BenchmarksPage() {
  return <BenchmarksContent />;
}
