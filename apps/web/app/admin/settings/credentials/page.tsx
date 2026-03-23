import type { Metadata } from 'next';
import { CredentialsContent } from './CredentialsContent';

export const metadata: Metadata = {
  title: 'Admin - Credentials',
};

export default function AdminCredentialsPage() {
  return <CredentialsContent />;
}
