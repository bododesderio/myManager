import 'next-auth';
import 'next-auth/jwt';

declare module 'next-auth' {
  interface User {
    id: string;
    email: string;
    name: string;
    emailVerified?: Date | null;
    avatar_url?: string | null;
    is_superadmin?: boolean;
    accessToken?: string;
    refreshToken?: string;
    remember?: boolean;
  }

  interface Session {
    accessToken: string;
    user: {
      id: string;
      email: string;
      name: string;
      avatar_url: string | null;
      is_superadmin: boolean;
    };
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    email: string;
    name: string;
    avatar_url: string | null;
    is_superadmin: boolean;
    accessToken: string;
    accessTokenExpires: number;
    refreshToken?: string;
    remember?: boolean;
    sessionExpires?: number;
    error?: string;
  }
}
