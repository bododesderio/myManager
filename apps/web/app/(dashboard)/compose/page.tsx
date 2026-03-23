import type { Metadata } from 'next';
import { ComposeContent } from './ComposeContent';

export const metadata: Metadata = {
  title: 'Compose',
};

export default function ComposePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold">Compose Post</h1>
        <p className="mt-1 text-sm text-gray-500">
          Create and schedule content for your social accounts.
        </p>
      </div>
      <ComposeContent />
    </div>
  );
}
