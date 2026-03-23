import type { Metadata } from 'next';
import { UsersContent } from './UsersContent';

export const metadata: Metadata = {
  title: 'Admin - Users',
};

export default function AdminUsersPage() {
  return <UsersContent />;
}
