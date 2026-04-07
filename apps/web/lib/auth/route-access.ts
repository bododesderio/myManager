export const dashboardRoutePrefixes = [
  '/home',
  '/compose',
  '/calendar',
  '/drafts',
  '/analytics',
  '/reports',
  '/media',
  '/templates',
  '/approvals',
  '/team',
  '/projects',
  '/conversations',
  '/settings',
  '/posts',
  '/campaigns',
  '/bio',
] as const;

export const authRoutePrefixes = ['/login', '/signup', '/reset-password', '/verify-email'] as const;

export const middlewareMatcher = [
  '/admin',
  '/superadmin/:path*',
  '/user/:path*',
  '/home',
  '/home/:path*',
  '/compose',
  '/compose/:path*',
  '/calendar',
  '/calendar/:path*',
  '/drafts',
  '/drafts/:path*',
  '/analytics',
  '/analytics/:path*',
  '/reports',
  '/reports/:path*',
  '/media',
  '/media/:path*',
  '/templates',
  '/templates/:path*',
  '/approvals',
  '/approvals/:path*',
  '/team',
  '/team/:path*',
  '/projects',
  '/projects/:path*',
  '/conversations',
  '/conversations/:path*',
  '/settings',
  '/settings/:path*',
  '/posts/:path*',
  '/campaigns',
  '/campaigns/:path*',
  '/bio',
  '/bio/:path*',
  '/login',
  '/signup',
  '/signup/:path*',
  '/reset-password',
  '/verify-email',
  '/portal/:path*',
] as const;

export function isAuthRoute(pathname: string): boolean {
  return authRoutePrefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

export function isDashboardRoute(pathname: string): boolean {
  return dashboardRoutePrefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export function getLegacyDashboardRedirect(pathname: string): string | null {
  if (pathname === '/user/home' || pathname === '/user/dashboard') {
    return '/home';
  }

  return null;
}
