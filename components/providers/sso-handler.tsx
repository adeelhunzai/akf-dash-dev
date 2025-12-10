'use client';

import { useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/lib/store/hooks';
import { setToken, setUser, initializeAuth } from '@/lib/store/slices/authSlice';
import { useExchangeSSOTokenMutation } from '@/lib/store/api/authApi';
import { UserRole } from '@/lib/types/roles';

/**
 * Maps WordPress roles to application UserRole
 */
function mapWordPressRoleToUserRole(wpRoles: string[]): UserRole {
  if (wpRoles.includes('administrator')) {
    return UserRole.ADMIN;
  }
  if (wpRoles.includes('group_leader')) {
    return UserRole.MANAGER;
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
  const searchParams = useSearchParams();
  const router = useRouter();
  const [exchangeToken, { isLoading, isError, error }] = useExchangeSSOTokenMutation();

  // Initialize auth on mount (load token from localStorage)
  useEffect(() => {
    dispatch(initializeAuth());
  }, [dispatch]);

  // Handle SSO token exchange
  useEffect(() => {
    const ssoToken = searchParams.get('sso_token');
    
    if (ssoToken && !token) {
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
            router.replace(newUrl.pathname + newUrl.search);
          }
        })
        .catch((err) => {
          console.error('SSO token exchange failed:', err);
          // Remove invalid token from URL
          const newUrl = new URL(window.location.href);
          newUrl.searchParams.delete('sso_token');
          router.replace(newUrl.pathname + newUrl.search);
        });
    }
  }, [searchParams, token, exchangeToken, dispatch, router]);

  // Show loading state during SSO exchange
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Authenticating...</p>
        </div>
      </div>
    );
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

