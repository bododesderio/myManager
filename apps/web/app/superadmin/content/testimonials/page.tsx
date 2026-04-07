import type { Metadata } from 'next';
import { TestimonialsContent } from './TestimonialsContent';

export const metadata: Metadata = {
  title: 'Admin - Testimonials',
};

export default function AdminTestimonialsPage() {
  return <TestimonialsContent />;
}
