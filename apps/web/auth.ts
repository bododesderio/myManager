import NextAuth from 'next-auth';
import { authConfig } from '@/lib/auth/auth.config';

const nextAuth = NextAuth({
  ...authConfig,
  trustHost: true,
});

export const auth: typeof nextAuth.auth = nextAuth.auth;
export const handlers = nextAuth.handlers;
export const { GET, POST } = handlers;
