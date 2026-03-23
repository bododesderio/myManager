import NextAuth from 'next-auth';
import { authConfig } from '@/lib/auth/auth.config';

const nextAuth = NextAuth(authConfig);

export const auth: typeof nextAuth.auth = nextAuth.auth;
export const handlers = nextAuth.handlers;
export const { GET, POST } = handlers;
