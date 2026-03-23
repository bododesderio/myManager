import type { Metadata } from 'next';
import { NavLinksContent } from './NavLinksContent';

export const metadata: Metadata = {
  title: 'Admin - Nav Links',
};

export default function AdminNavLinksPage() {
  return <NavLinksContent />;
}
