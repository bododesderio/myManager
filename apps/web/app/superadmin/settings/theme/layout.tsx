import type { Metadata } from 'next';
import type { ReactNode } from 'react';

// The theme page itself is a client component and can't export metadata, so the
// route's <title> is set here (was falling back to the generic app default).
export const metadata: Metadata = {
  title: 'Admin - Theme Editor',
};

export default function ThemeSettingsLayout({ children }: { children: ReactNode }) {
  return children;
}
