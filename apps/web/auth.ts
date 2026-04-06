import NextAuth, { getServerSession } from 'next-auth';
import { authConfig } from '@/lib/auth/auth.config';

const handler = NextAuth(authConfig);

export function auth() {
  return getServerSession(authConfig);
}

export { handler as GET, handler as POST };
