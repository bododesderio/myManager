import { NextRequest, NextResponse } from 'next/server';
import {
  getLegacyDashboardRedirect,
  isAuthRoute,
  isDashboardRoute,
} from '@/lib/auth/route-access';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token =
    request.cookies.get('authjs.session-token')?.value ??
    request.cookies.get('__Secure-authjs.session-token')?.value ??
    request.cookies.get('next-auth.session-token')?.value ??
    request.cookies.get('__Secure-next-auth.session-token')?.value;

  const isPortalRoute = pathname.startsWith('/portal');
  const isSuperadminRoute = pathname.startsWith('/superadmin');
  const isLegacyAdminRoute = pathname === '/admin' || pathname.startsWith('/admin/');
  const isUserRoute = pathname.startsWith('/user');
  const isProtectedDashboardRoute = isDashboardRoute(pathname);
  const isCheckoutRoute = pathname.startsWith('/signup/checkout');
  const isPublicAuthRoute = isAuthRoute(pathname);

  // 301 redirect legacy /admin/* to /superadmin/* (after rename)
  if (isLegacyAdminRoute) {
    const newPath = pathname.replace(/^\/admin/, '/superadmin') || '/superadmin/dashboard';
    return NextResponse.redirect(new URL(newPath, request.url), 301);
  }

  const accountStatus = request.cookies.get('account_status')?.value;
  const isPendingPayment = accountStatus === 'PENDING_PAYMENT';

  const legacyRedirect = getLegacyDashboardRedirect(pathname);
  if (legacyRedirect) {
    return NextResponse.redirect(new URL(legacyRedirect, request.url), 301);
  }

  if (isPortalRoute) {
    return NextResponse.next();
  }

  if ((isProtectedDashboardRoute || isUserRoute) && token && isPendingPayment) {
    return NextResponse.redirect(new URL('/signup/checkout', request.url));
  }

  if (isPublicAuthRoute && token && isPendingPayment && !isCheckoutRoute) {
    return NextResponse.redirect(new URL('/signup/checkout', request.url));
  }

  if (isCheckoutRoute && token && isPendingPayment) {
    return NextResponse.next();
  }

  if (isPublicAuthRoute && token) {
    return NextResponse.redirect(new URL('/home', request.url));
  }

  if ((isSuperadminRoute || isUserRoute || isProtectedDashboardRoute) && !token) {
    const url = new URL('/login', request.url);
    url.searchParams.set('next', pathname);
    return NextResponse.redirect(url);
  }

  if (pathname === '/superadmin') {
    return NextResponse.redirect(new URL('/superadmin/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/admin',
    '/admin/:path*',
    '/superadmin',
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
  ],
};
