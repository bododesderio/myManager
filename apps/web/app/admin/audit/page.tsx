import type { Metadata } from 'next';
import { AuditLogContent } from './AuditLogContent';

export const metadata: Metadata = {
  title: 'Admin - Audit Log',
};

export default function AdminAuditPage() {
  return <AuditLogContent />;
}
