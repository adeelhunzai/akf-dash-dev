import Cookies from 'js-cookie';

/**
 * Cookie configuration for JWT token
 */
const TOKEN_COOKIE_NAME = 'jwt_token';

/**
 * Get cookie options with proper expiration (2 hours)
 * Note: Cookies are shared across all tabs in the same browser (same origin)
 */
function getCookieOptions() {
  const expirationDate = new Date();
  expirationDate.setTime(expirationDate.getTime() + 2 * 60 * 60 * 1000); // 2 hours from now
  
  return {
    secure: process.env.NODE_ENV === 'production', // HTTPS only in production
    sameSite: 'lax' as const, // CSRF protection, but allows cross-tab access
    path: '/', // Available site-wide (all tabs can access)
    expires: expirationDate, // 2 hours (matches JWT expiration)
    // Note: Cookies are automatically shared across tabs in the same browser
  };
}

/**
 * Set JWT token in cookie
 */
export function setTokenCookie(token: string | null): void {
  if (typeof window === 'undefined') return;
  
  if (token) {
    Cookies.set(TOKEN_COOKIE_NAME, token, getCookieOptions());
  } else {
    Cookies.remove(TOKEN_COOKIE_NAME, { path: '/' });
  }
}

/**
 * Get JWT token from cookie
 */
export function getTokenCookie(): string | null {
  if (typeof window === 'undefined') return null;
  return Cookies.get(TOKEN_COOKIE_NAME) || null;
}

/**
 * Remove JWT token from cookie
 */
export function removeTokenCookie(): void {
  if (typeof window === 'undefined') return;
  Cookies.remove(TOKEN_COOKIE_NAME, { path: '/' });
}

/**
 * Check if token cookie exists
 */
export function hasTokenCookie(): boolean {
  if (typeof window === 'undefined') return false;
  return Cookies.get(TOKEN_COOKIE_NAME) !== undefined;
}

