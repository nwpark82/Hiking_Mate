import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { i18n } from './lib/i18n/config';

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Skip middleware for static files, API routes, and special Next.js routes
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/static') ||
    pathname.includes('/icon') ||
    pathname.includes('/apple-icon') ||
    pathname.includes('/favicon') ||
    pathname.includes('/manifest') ||
    pathname.includes('/robots') ||
    pathname.includes('/sitemap') ||
    pathname.match(/\.(ico|png|jpg|jpeg|svg|webp|gif|css|js)$/)
  ) {
    return NextResponse.next();
  }

  // Check if the pathname already has a locale
  const pathnameHasLocale = i18n.locales.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  );

  if (pathnameHasLocale) {
    return NextResponse.next();
  }

  // Get locale from cookie or accept-language header
  const cookieLocale = request.cookies.get('NEXT_LOCALE')?.value;
  const acceptLanguage = request.headers.get('accept-language');

  let locale = i18n.defaultLocale;

  if (cookieLocale && i18n.locales.includes(cookieLocale as any)) {
    locale = cookieLocale;
  } else if (acceptLanguage) {
    // Simple language detection
    const preferredLang = acceptLanguage.split(',')[0].split('-')[0];
    if (i18n.locales.includes(preferredLang as any)) {
      locale = preferredLang;
    }
  }

  // Redirect to locale-specific path
  const url = request.nextUrl.clone();
  url.pathname = `/${locale}${pathname}`;

  const response = NextResponse.redirect(url);
  response.cookies.set('NEXT_LOCALE', locale, { maxAge: 365 * 24 * 60 * 60 });

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)',
  ],
};
