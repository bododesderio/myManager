import type { Metadata } from 'next';
import { CalendarContent } from './CalendarContent';

export const metadata: Metadata = {
  title: 'Content Calendar',
};

export default function CalendarPage() {
  return <CalendarContent />;
}
