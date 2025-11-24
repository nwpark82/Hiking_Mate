import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

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

  // i18n routing disabled - app structure doesn't support locale-based routing
  // If needed in future, restructure app to use app/[locale]/ pattern
  return NextResponse.next();
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
