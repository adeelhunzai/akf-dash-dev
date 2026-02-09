'use client';

import { useEffect, useRef } from 'react';
import { DashboardSkeleton } from '@/components/shared/layout/dashboard-skeleton';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/lib/store/hooks';
import { setToken, setUser, initializeAuth, logout } from '@/lib/store/slices/authSlice';
import { useExchangeSSOTokenMutation } from '@/lib/store/api/authApi';
import { UserRole } from '@/lib/types/roles';
import { getUserIdCookie } from '@/lib/utils/cookies';

/**
 * Maps WordPress roles to application UserRole
 * Note: group_leader = FACILITATOR, group_leader_clone = MANAGER
 */
function mapWordPressRoleToUserRole(wpRoles: string[]): UserRole {
  if (wpRoles.includes('administrator')) {
    return UserRole.ADMIN;
  }
  // group_leader_clone maps to MANAGER
  if (wpRoles.includes('group_leader_clone')) {
    return UserRole.MANAGER;
  }
  // group_leader maps to FACILITATOR
  if (wpRoles.includes('group_leader')) {
    return UserRole.FACILITATOR;
  }
  if (wpRoles.includes('editor') || wpRoles.includes('author')) {
    return UserRole.FACILITATOR;
  }
  return UserRole.LEARNER;
}

/**
 * SSO Handler Component
 * Handles SSO token exchange when user is redirected from WordPress
 */
export function SSOHandler({ children }: { children: React.ReactNode }) {
  const dispatch = useAppDispatch();
  const token = useAppSelector((state) => state.auth.token);
  const user = useAppSelector((state) => state.auth.user);
  const searchParams = useSearchParams();
  const router = useRouter();
  const [exchangeToken, { isLoading, isError, error }] = useExchangeSSOTokenMutation();
  const isInitializing = useAppSelector((state) => state.auth.isInitializing);
  
  // Track processed token to prevent duplicate calls in Strict Mode or due to effect re-runs
  const processedTokenRef = useRef<string | null>(null);

  // Handle SSO token exchange
  useEffect(() => {
    // Wait for auth initialization to complete
    if (isInitializing) return;

    const ssoToken = searchParams.get('sso_token');
    const urlUid = searchParams.get('uid');
    
    // If we've already processed this exact token, don't do anything
    // This prevents double-invocation in Strict Mode or if other dependencies change
    if (ssoToken && processedTokenRef.current === ssoToken) {
      return;
    }
    
    // If we already have a valid token, we don't need to exchange
    // UNLESS the sso request is for a different user (uid mismatch)
    if (token) {
      // Check if the requested user ID matches the current session (stored in cookie)
      // If urlUid is present, we must match it against the cookie.
      const cookieUserId = getUserIdCookie();
      const isUserMismatch = urlUid && String(cookieUserId) !== String(urlUid);

      if (!isUserMismatch) {
        if (ssoToken || urlUid) {
          // Just clean up the URL
          const newUrl = new URL(window.location.href);
          newUrl.searchParams.delete('sso_token');
          newUrl.searchParams.delete('uid');
          router.replace(newUrl.pathname + newUrl.search);
        }
        return;
      }
      
      // If we have a mismatch, we proceed to exchange the token below
      // This effectively logs out the old user and logs in the new one
    }
    
    if (ssoToken) {
      // Mark this token as processed IMMEDIATELY to prevent race conditions
      processedTokenRef.current = ssoToken;

      // If we're exchanging a token (meaning we either had no session or a mismatch),
      // ensure any existing stale state is cleared first.
      if (token) {
        dispatch(logout());
      }

      // Exchange SSO token for JWT
      exchangeToken({ token: ssoToken })
        .unwrap()
        .then((response) => {
          if (response.success) {
            // Store JWT token
            dispatch(setToken(response.token));
            
            // Transform and set user
            const user = {
              id: String(response.user.id),
              name: response.user.display_name,
              email: response.user.email,
              role: mapWordPressRoleToUserRole(response.user.roles),
              avatar: response.user.avatar_url,
            };
            dispatch(setUser(user));
            
            // Remove sso_token from URL
            const newUrl = new URL(window.location.href);
            newUrl.searchParams.delete('sso_token');
            newUrl.searchParams.delete('uid');
            router.replace(newUrl.pathname + newUrl.search);
          }
        })
        .catch((err) => {
          console.error('SSO token exchange failed:', err);
          // Only clear the ref if it failed network-wise (optional, but safer to force reload)
          // For now, we leave it processed to prevent infinite loops of retries
          
          // Remove invalid token from URL
          const newUrl = new URL(window.location.href);
          newUrl.searchParams.delete('sso_token');
          newUrl.searchParams.delete('uid');
          router.replace(newUrl.pathname + newUrl.search);
        });
    }
  }, [searchParams, token, exchangeToken, dispatch, router, isInitializing]);

  // Determine if we should show skeleton
  // 1. If SSO exchange is loading, always show skeleton
  // 2. If initializing AND we don't have a trusted session, show skeleton
  // A trusted session = we have a token AND (no uid in URL OR uid matches cookie)
  const ssoToken = searchParams.get('sso_token');
  const urlUid = searchParams.get('uid');
  const cookieUserId = getUserIdCookie();
  const hasTrustedSession = token && (!urlUid || String(cookieUserId) === String(urlUid));
  
  const shouldShowSkeleton = isLoading || (isInitializing && !hasTrustedSession);
  
  if (shouldShowSkeleton) {
    return <DashboardSkeleton />;
  }

  // Show error state if SSO exchange failed
  if (isError && searchParams.get('sso_token')) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-600 mb-4">Authentication failed</p>
          <p className="text-gray-600 text-sm">
            {error && 'data' in error && typeof error.data === 'object' && error.data !== null && 'message' in error.data
              ? String(error.data.message)
              : 'Please try again or contact support.'}
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

