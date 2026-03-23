import type { Metadata } from 'next';
import { HashtagsContent } from './HashtagsContent';

export const metadata: Metadata = {
  title: 'Hashtag Analytics',
};

export default function HashtagAnalyticsPage() {
  return <HashtagsContent />;
}
