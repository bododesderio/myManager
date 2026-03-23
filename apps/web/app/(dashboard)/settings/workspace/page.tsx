import type { Metadata } from 'next';
import WorkspaceSettingsContent from './WorkspaceSettingsContent';

export const metadata: Metadata = {
  title: 'Workspace Settings',
};

export default function WorkspaceSettingsPage() {
  return <WorkspaceSettingsContent />;
}
