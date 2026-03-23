import type { Metadata } from 'next';
import { MediaContent } from './MediaContent';

export const metadata: Metadata = {
  title: 'Media Library',
};

export default function MediaPage() {
  return <MediaContent />;
}
