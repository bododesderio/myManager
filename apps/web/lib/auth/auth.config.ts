import type { NextAuthConfig } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';

const API_URL = process.env.API_URL || 'http://localhost:3001';
const NEXTAUTH_SECRET = process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET;

if (!NEXTAUTH_SECRET) {
  throw new Error('NEXTAUTH_SECRET or AUTH_SECRET must be set');
}

async function refreshAccessToken(token: any) {
  try {
    const res = await fetch(`${API_URL}/api/v1/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `refresh_token=${token.refreshToken}`,
      },
    });

    if (!res.ok) {
      return { ...token, error: 'RefreshTokenExpired' };
    }

    const data = await res.json();

    // Extract new refresh token from set-cookie header
    const setCookie = res.headers.get('set-cookie');
    const newRefreshToken = setCookie
      ?.split(';')
      .find((c: string) => c.trim().startsWith('refresh_token='))
      ?.split('=')[1];

    return {
      ...token,
      accessToken: data.accessToken,
      accessTokenExpires: Date.now() + 14 * 60 * 1000, // 14 minutes
      refreshToken: newRefreshToken || token.refreshToken,
      error: undefined,
    };
  } catch {
    return { ...token, error: 'RefreshTokenExpired' };
  }
}

export const authConfig: NextAuthConfig = {
  providers: [
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
        totp_code: { label: '2FA Code', type: 'text' },
        remember: { label: 'Remember Me', type: 'text' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        try {
          const res = await fetch(`${API_URL}/api/v1/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: credentials.email,
              password: credentials.password,
              totp_code: credentials.totp_code,
            }),
          });

          if (!res.ok) {
            const error = await res.json().catch(() => null);
            throw new Error(error?.error?.code || 'AUTH_INVALID_CREDENTIALS');
          }

          const data = await res.json();

          // Handle 2FA requirement
          if (data.user?.requiresTwoFactor) {
            if (!credentials.totp_code) {
              throw new Error('AUTH_2FA_REQUIRED');
            }
            // Re-attempt login with 2FA code would need a separate endpoint
            // For now, throw to indicate 2FA is needed
            throw new Error('AUTH_2FA_REQUIRED');
          }

          // Extract refresh token from set-cookie header
          const setCookie = res.headers.get('set-cookie');
          const refreshToken = setCookie
            ?.split(';')
            .find((c: string) => c.trim().startsWith('refresh_token='))
            ?.split('=')[1];

          return {
            id: data.user.id,
            email: data.user.email,
            name: data.user.name,
            emailVerified: data.user.email_verified ? new Date(data.user.email_verified) : null,
            avatar_url: data.user.avatar_url || null,
            is_superadmin: data.user.is_superadmin || false,
            accessToken: data.accessToken,
            refreshToken: refreshToken || '',
            remember: credentials.remember === 'true',
          };
        } catch (error) {
          if (error instanceof Error) {
            throw error;
          }
          return null;
        }
      },
    }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // default 30 days (used when remember=true)
  },
  secret: NEXTAUTH_SECRET,
  pages: {
    signIn: '/login',
    error: '/login',
  },
  callbacks: {
    async jwt({ token, user }) {
      // Initial sign-in: user object is available
      if (user) {
        const remember = (user as any).remember === true;
        // remember=true  → session lives 30 days
        // remember=false → session lives 24 hours
        const sessionMaxAge = remember ? 30 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000;
        return {
          ...token,
          id: user.id,
          email: user.email!,
          name: user.name!,
          avatar_url: user.avatar_url || null,
          is_superadmin: user.is_superadmin || false,
          accessToken: user.accessToken!,
          accessTokenExpires: Date.now() + 14 * 60 * 1000, // 14 minutes
          refreshToken: user.refreshToken,
          remember,
          sessionExpires: Date.now() + sessionMaxAge,
        };
      }

      // Check if the session itself has expired (remember me logic)
      if (token.sessionExpires && Date.now() > (token.sessionExpires as number)) {
        return { ...token, error: 'SessionExpired' };
      }

      // Return valid token
      if (Date.now() < (token.accessTokenExpires as number)) {
        return token;
      }

      // Token expired, refresh it
      return refreshAccessToken(token);
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken as string;
      session.user = {
        id: token.id as string,
        email: token.email as string,
        name: token.name as string,
        emailVerified: null,
        avatar_url: token.avatar_url as string | null,
        is_superadmin: token.is_superadmin as boolean,
      } as any;
      return session;
    },
  },
};
