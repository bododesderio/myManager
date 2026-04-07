import type { Metadata } from 'next';
import { WorkspacesContent } from './WorkspacesContent';

export const metadata: Metadata = {
  title: 'Admin - Workspaces',
};

export default function AdminWorkspacesPage() {
  return <WorkspacesContent />;
}
