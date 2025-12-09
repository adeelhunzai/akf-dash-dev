import createIntlMiddleware from 'next-intl/middleware';
import { NextRequest, NextResponse } from 'next/server';
import { locales, defaultLocale } from './lib/i18n/config';
import { isPublicRoute, hasRouteAccess, getDefaultDashboardPath, getRequiredRoleForRoute, isAuthCallbackRoute } from './lib/utils/auth';
import { UserRole } from './lib/types/roles';

// Create the intl middleware
const intlMiddleware = createIntlMiddleware({
  locales,
  defaultLocale,
  localePrefix: 'always',
});

/**
 * Decode JWT token to get user info (client-side only, for middleware we'll validate via API)
 * In middleware, we can't easily decode JWT, so we'll check token existence and validate on client
 */
function getTokenFromRequest(request: NextRequest): string | null {
  return request.cookies.get('jwt_token')?.value || null;
}

/**
 * Main middleware function
 */
export default async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Check if pathname starts with a locale
  const firstSegment = pathname.split('/')[1];
  const hasLocale = locales.includes(firstSegment as any);
  const locale = hasLocale ? firstSegment : defaultLocale;
  
  // If pathname doesn't have a locale prefix, add it (except for root)
  if (!hasLocale && pathname !== '/') {
    // Create new URL with locale prefix
    const urlWithLocale = new URL(`/${defaultLocale}${pathname}`, request.nextUrl.origin);
    // Preserve all query parameters from the original request
    request.nextUrl.searchParams.forEach((value, key) => {
      urlWithLocale.searchParams.set(key, value);
    });
    return NextResponse.redirect(urlWithLocale);
  }
  
  // Extract the path without locale
  let pathWithoutLocale = hasLocale ? pathname.replace(`/${locale}`, '') : pathname;
  if (!pathWithoutLocale || pathWithoutLocale === '') {
    pathWithoutLocale = '/';
  } else if (!pathWithoutLocale.startsWith('/')) {
    pathWithoutLocale = `/${pathWithoutLocale}`;
  }
  
  // Handle root route - allow through, RouteGuard will show appropriate page
  // No redirect needed - authentication is SSO-only
  
  // Handle public routes - allow access without authentication
  // Only /auth/callback and other auth routes are public
  // IMPORTANT: Check this BEFORE checking for token to avoid redirect loops
  if (isPublicRoute(pathWithoutLocale) || isAuthCallbackRoute(pathWithoutLocale)) {
    return intlMiddleware(request);
  }
  
  // Check for authentication token
  const token = getTokenFromRequest(request);
  
  // Debug: Log token status (remove in production)
  if (process.env.NODE_ENV === 'development') {
    console.log(`[Middleware] Path: ${pathname}, Token: ${token ? 'exists' : 'missing'}, PathWithoutLocale: ${pathWithoutLocale}`);
  }
  
  // For protected routes without token, allow through to show ForbiddenAccess page
  // Don't redirect - authentication is SSO-only via WordPress
  // RouteGuard will handle showing the ForbiddenAccess page
  
  // If token exists, we'll validate role on client-side (middleware can't easily decode JWT)
  // This is acceptable because:
  // 1. Token validation happens on every API call
  // 2. Client-side components will check role and redirect if needed
  // 3. RouteGuard will show ForbiddenAccess for unauthenticated users
  
  // Continue with intl middleware
  return intlMiddleware(request);
}

export const config = {
  // Match only internationalized pathnames
  matcher: [
    // Match all pathnames except for
    // - … if they start with `/api`, `/_next` or `/_vercel`
    // - … the ones containing a dot (e.g. `favicon.ico`)
    '/((?!api|_next|_vercel|.*\\..*).*)',
  ],
};
