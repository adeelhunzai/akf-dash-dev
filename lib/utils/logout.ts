import { AppDispatch } from '@/lib/store';
import { logout, setLoggingOut } from '@/lib/store/slices/authSlice';
import { authApi } from '@/lib/store/api/authApi';
import { WORDPRESS_API_URL } from '@/lib/config/wordpress.config';

/**
 * Handles user logout:
 * 1. Sets logging out state to prevent showing ForbiddenAccess
 * 2. Redirects to WordPress immediately
 * 3. Revokes the JWT token on WordPress backend (optional, in background)
 * 4. Clears Redux auth state and token cookie
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
  
  // Redirect to WordPress immediately (before clearing token to avoid ForbiddenAccess flash)
  if (redirectToWordPress) {
    try {
      // Use WordPress URL from Redux state if available
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
      
      // Redirect to WordPress website immediately
      window.location.href = wpBaseUrl;
    } catch (error) {
      console.error('Failed to redirect to WordPress:', error);
      // Fallback: try to extract from API URL
      const fallbackUrl = WORDPRESS_API_URL?.replace('/wp-json', '') || '/';
      window.location.href = fallbackUrl;
    }
  }
  
  // Clear Redux state and cookie after redirect is initiated
  // This happens in the background while redirect is processing
  dispatch(logout());
  
  // Reset all RTK Query caches
  dispatch(authApi.util.resetApiState());
  
  // Try to revoke the token on WordPress backend (optional, but good practice)
  // This happens in the background and won't block the redirect
  if (token) {
    try {
      // Use RTK Query's initiate method to call the mutation
      const result = await dispatch(
        authApi.endpoints.revokeToken.initiate({ token })
      );
      
      // Check if the result is an error
      if ('error' in result) {
        console.warn('Failed to revoke token on backend:', result.error);
      }
    } catch (error) {
      // If revoke fails, continue with logout anyway
      // Token will expire naturally, and we're clearing it from client
      console.warn('Error during token revocation:', error);
    }
  }
}

