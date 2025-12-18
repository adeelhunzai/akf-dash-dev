import { AppDispatch } from '@/lib/store';
import { logout, setLoggingOut, clearAuthForRedirect } from '@/lib/store/slices/authSlice';
import { authApi } from '@/lib/store/api/authApi';
import { WORDPRESS_API_URL } from '@/lib/config/wordpress.config';

/**
 * Handles user logout:
 * 1. Sets logging out state to prevent showing ForbiddenAccess
 * 2. Clears auth state and cookie (prevents back navigation access)
 * 3. Redirects to WordPress
 * 4. Revokes the JWT token on WordPress backend (optional, in background)
 * 5. Resets RTK Query cache
 */
export async function handleLogout(
  dispatch: AppDispatch,
  token: string | null,
  redirectToWordPress: boolean = true,
  wordpressUrl?: string | null
): Promise<void> {
  // Set logging out state immediately to prevent RouteGuard from showing ForbiddenAccess
  dispatch(setLoggingOut(true));
  
  // Reset all RTK Query caches first
  dispatch(authApi.util.resetApiState());
  
  // Try to revoke the token on WordPress backend (fire and forget)
  // Do this before clearing the token so we still have it
  if (token) {
    dispatch(authApi.endpoints.revokeToken.initiate({ token })).catch(() => {
      // Ignore errors - token will expire naturally
    });
  }
  
  // Redirect to WordPress
  if (redirectToWordPress) {
    // Use clearAuthForRedirect which clears auth data but keeps isLoggingOut=true
    // This ensures:
    // 1. Cookie is removed (user can't navigate back and access dashboard)
    // 2. RouteGuard shows "Logging out..." loader (not "Access Forbidden")
    dispatch(clearAuthForRedirect());
    
    // Determine redirect URL
    let wpBaseUrl = wordpressUrl || '';
    
    // Fallback: Extract WordPress base URL from API URL
    if (!wpBaseUrl && WORDPRESS_API_URL) {
      const extractedUrl = WORDPRESS_API_URL.replace('/wp-json', '');
      if (extractedUrl && extractedUrl !== WORDPRESS_API_URL) {
        wpBaseUrl = extractedUrl;
      }
    }
    
    // Final fallback if no URL available
    if (!wpBaseUrl) {
      console.warn('No WordPress URL available for redirect');
      wpBaseUrl = '/';
    }
    
    // Redirect to WordPress website
    window.location.href = wpBaseUrl;
    return;
  }
  
  // If NOT redirecting to WordPress, use regular logout
  dispatch(logout());
}

