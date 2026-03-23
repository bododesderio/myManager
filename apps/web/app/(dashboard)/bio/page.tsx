import type { Metadata } from 'next';
import { BioContent } from './BioContent';

export const metadata: Metadata = {
  title: 'Bio Link',
};

export default function BioPage() {
  return <BioContent />;
}
