'use client';

import { useEffect, useRef, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/lib/store/hooks';
import { setToken, setUser, initializeAuth, setInitializing } from '@/lib/store/slices/authSlice';
import { useExchangeSSOTokenMutation } from '@/lib/store/api/authApi';
import { UserRole } from '@/lib/types/roles';
import { hasRouteAccess, getDefaultDashboardPath } from '@/lib/utils/auth';
import { useLocale } from 'next-intl';
import { Spinner } from '@/components/ui/spinner';
import { AlertTriangle, LogIn } from 'lucide-react';

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
 * Auth Callback Page
 * Handles SSO token exchange when user is redirected from WordPress
 */
export default function AuthCallbackPage() {
  const dispatch = useAppDispatch();
  const token = useAppSelector((state) => state.auth.token);
  const user = useAppSelector((state) => state.auth.user);
  const authLoading = useAppSelector((state) => state.auth.loading);
  const searchParams = useSearchParams();
  const router = useRouter();
  const locale = useLocale();
  const [exchangeToken, { isLoading, isError, error }] = useExchangeSSOTokenMutation();
  const hasExchanged = useRef(false);
  const [isInitializing, setIsInitializing] = useState(true);

  // Initialize auth on mount (load token from cookie)
  useEffect(() => {
    dispatch(initializeAuth());
    // Give a small delay to allow auth state to initialize
    const timer = setTimeout(() => {
      setIsInitializing(false);
    }, 100);
    return () => clearTimeout(timer);
  }, [dispatch]);

  // Handle redirect if user already has token (authenticated user visiting auth callback)
  const redirectParam = searchParams.get('redirect');
  
  useEffect(() => {
    // If user has token but no SSO token, they're already authenticated
    // Redirect them to their intended destination or default dashboard
    if (token && !searchParams.get('sso_token') && !isLoading) {
      if (user) {
        // Determine where to redirect
        let finalRedirectPath: string;
        
        if (redirectParam) {
          // Check if user has access to the requested path
          // Remove locale from redirectParam for role check
          const redirectPathWithoutLocale = redirectParam.replace(`/${locale}`, '') || redirectParam;
          
          if (hasRouteAccess(user.role, redirectPathWithoutLocale)) {
            // User has access to the requested path
            finalRedirectPath = redirectParam;
          } else {
            // User doesn't have access - redirect to their default dashboard
            finalRedirectPath = getDefaultDashboardPath(user.role, locale);
          }
        } else {
          // No redirect param - redirect to appropriate dashboard based on role
          finalRedirectPath = getDefaultDashboardPath(user.role, locale);
        }
        
        router.replace(finalRedirectPath);
      } else {
        // Token exists but user not loaded yet, wait a bit
        // This will be handled by the token validation in AuthInitializer
      }
    }
  }, [token, redirectParam, user, isLoading, router, searchParams, locale]);

  // Handle SSO token exchange
  useEffect(() => {
    const ssoToken = searchParams.get('sso_token');
    
    console.log('Auth callback - SSO token:', ssoToken ? 'present' : 'missing');
    console.log('Auth callback - Current token:', token ? 'present' : 'missing');
    console.log('Auth callback - Has exchanged:', hasExchanged.current);
    
    // Prevent multiple exchanges
    if (hasExchanged.current || token) {
      console.log('Auth callback - Skipping exchange (already exchanged or token exists)');
      return;
    }
    
    if (ssoToken) {
      console.log('Auth callback - Starting SSO token exchange');
      hasExchanged.current = true;
      
      // Exchange SSO token for JWT
      exchangeToken({ token: ssoToken })
        .unwrap()
        .then((response) => {
          console.log('Auth callback - SSO exchange successful:', response);
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
            dispatch(setInitializing(false));
            
            // Check if there's a redirect parameter (from middleware or unauthorized access)
            const redirectParam = searchParams.get('redirect');
            
            console.log('Auth callback - Redirect param:', redirectParam);
            console.log('Auth callback - Locale:', locale);
            
            // Determine where to redirect
            let finalRedirectPath: string;
            
            if (redirectParam) {
              // Check if user has access to the requested path
              // Remove locale from redirectParam for role check
              const redirectPathWithoutLocale = redirectParam.replace(`/${locale}`, '') || redirectParam;
              
              if (hasRouteAccess(user.role, redirectPathWithoutLocale)) {
                // User has access to the requested path
                console.log('Auth callback - User has access to redirect path:', redirectParam);
                finalRedirectPath = redirectParam;
              } else {
                // User doesn't have access - redirect to their default dashboard
                console.log('Auth callback - User does not have access to redirect path, redirecting to default dashboard');
                finalRedirectPath = getDefaultDashboardPath(user.role, locale);
              }
            } else {
              // No redirect param - redirect to appropriate dashboard based on role
              finalRedirectPath = getDefaultDashboardPath(user.role, locale);
            }
            
            console.log('Auth callback - Final redirect path:', finalRedirectPath);
            router.replace(finalRedirectPath);
          }
        })
        .catch((err: any) => {
          // RTK Query errors - log everything we can
          console.error('Auth callback - SSO token exchange failed');
          console.error('Error object:', err);
          console.error('Error stringified:', JSON.stringify(err, Object.getOwnPropertyNames(err)));
          console.error('Error constructor:', err?.constructor?.name);
          console.error('Error prototype:', Object.getPrototypeOf(err));
          
          // Try multiple ways to get error info
          const errorInfo: any = {};
          try {
            if (err) {
              errorInfo.status = err.status;
              errorInfo.originalStatus = err.originalStatus;
              errorInfo.data = err.data;
              errorInfo.error = err.error;
              errorInfo.message = err.message;
              errorInfo.name = err.name;
              
              // Try to get all enumerable properties
              for (const key in err) {
                if (err.hasOwnProperty(key)) {
                  errorInfo[key] = err[key];
                }
              }
            }
          } catch (e) {
            console.error('Error extracting error info:', e);
          }
          
          console.error('Extracted error info:', errorInfo);
          
          hasExchanged.current = false; // Allow retry on error
          // Don't redirect - let the error UI show with "Close" button
          // The error state from the hook will be used to display the error
        });
    } else {
      // No SSO token and no existing token
      console.log('Auth callback - No SSO token and no existing token');
      // If user already has a token, they're already authenticated (handled by RouteGuard)
      // If no token at all, check if there's a redirect param - if so, we need to authenticate
      // Otherwise, this is likely a direct visit - show message or redirect to WordPress
      const redirectParam = searchParams.get('redirect');
      if (redirectParam) {
        // User was trying to access a protected route but has no token
        // They need to log in via WordPress first
        console.log('Auth callback - No token, but redirect param exists. User needs to log in via WordPress.');
      } else {
        // Direct visit to auth callback without SSO token or redirect
        // This shouldn't normally happen, but handle it gracefully
        console.log('Auth callback - Direct visit without SSO token or redirect param');
      }
    }
  }, [searchParams, exchangeToken, dispatch, router, token]);

  // Show loading state during initialization or SSO exchange
  const ssoToken = searchParams.get('sso_token');
  const isCheckingAuth = isInitializing || authLoading || isLoading || (ssoToken && !hasExchanged.current && !token);
  
  if (isCheckingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center justify-center text-center max-w-500px">
          <Spinner className="h-16 w-16 text-green-600 mb-6" />
          <p className="text-gray-700 text-lg font-medium">Authenticating...</p>
          <p className="text-gray-500 text-sm mt-2">Please wait while we verify your credentials</p>
        </div>
      </div>
    );
  }

  // Show error state if SSO exchange failed
  if (isError) {
    // Log error from hook state for debugging
    console.error('Error from hook state:', error);
    console.error('Error type from hook:', typeof error);
    if (error) {
      console.error('Error has data:', 'data' in error);
      console.error('Error has status:', 'status' in error);
      console.error('Error keys:', Object.keys(error));
    }
    
    // Extract error message from RTK Query error structure
    const getErrorMessage = () => {
      if (!error) return 'Authentication failed. Please try again.';
      
      // RTK Query FetchBaseQueryError structure
      // Check if it's a FetchBaseQueryError (has 'data' and 'status')
      if ('data' in error && 'status' in error) {
        const errorData = error.data as any;
        const status = error.status as number;
        
        // Try to extract message from error data
        if (typeof errorData === 'object' && errorData !== null) {
          // WordPress REST API error format
          if (errorData.message) return String(errorData.message);
          if (errorData.error) return String(errorData.error);
          // Check for nested error
          if (errorData.data && errorData.data.message) return String(errorData.data.message);
        }
        if (typeof errorData === 'string') {
          return errorData;
        }
        
        // Use status code for message if no data message
        if (status === 401) return 'Token is invalid or expired. Please try again.';
        if (status === 400) return 'Invalid request. Please try again.';
        if (status === 403) return 'Access denied. Please contact support.';
        if (status === 429) return 'Too many requests. Please wait a few minutes and try again.';
        if (status === 500) return 'Server error. Please try again later.';
        if (status) return `Error ${status}. Please try again.`;
      }
      
      // Check for SerializedError (has 'message' and 'name')
      if ('message' in error && error.message) {
        return String(error.message);
      }
      
      // Check status directly
      if ('status' in error) {
        const status = error.status as number;
        if (status === 401) return 'Token is invalid or expired. Please try again.';
        if (status === 400) return 'Invalid request. Please try again.';
        if (status === 403) return 'Access denied. Please contact support.';
        if (status === 429) return 'Too many requests. Please wait a few minutes and try again.';
        if (status === 500) return 'Server error. Please try again later.';
        if (status) return `Error ${status}. Please try again.`;
      }
      
      // Fallback message
      return 'Authentication failed. Please try again or contact support.';
    };

    return (
      <div className="fixed inset-0 flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center justify-center text-center max-w-md px-6">
          <AlertTriangle className="h-16 w-16 text-red-500 mb-6" />
          <p className="text-red-600 mb-4 text-xl font-semibold">Authentication failed</p>
          <p className="text-gray-600 text-sm mb-8">
            {getErrorMessage()}
          </p>
          <button
            onClick={() => {
              // Try to close the window/tab
              // Note: window.close() only works for windows opened by JavaScript
              // For security reasons, browsers prevent closing tabs opened by user
              try {
                window.close();
                // If window.close() doesn't work (browser blocked it), redirect to WordPress
                setTimeout(() => {
                  // If still open after 100ms, redirect back
                  if (!document.hidden) {
                    // Try to get referrer or redirect to a safe page
                    if (document.referrer) {
                      window.location.href = document.referrer;
                    } else {
                      window.location.href = 'about:blank';
                    }
                  }
                }, 100);
              } catch (e) {
                // Fallback: redirect to referrer or blank page
                if (document.referrer) {
                  window.location.href = document.referrer;
                } else {
                  window.location.href = 'about:blank';
                }
              }
            }}
            className="inline-block px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium shadow-sm cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  // Show redirecting state if user has token and we're redirecting
  if (token && !ssoToken) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center justify-center text-center">
          <Spinner className="h-16 w-16 text-green-600 mb-6" />
          <p className="text-gray-700 text-lg font-medium">Redirecting...</p>
          <p className="text-gray-500 text-sm mt-2">Please wait</p>
        </div>
      </div>
    );
  }

  // Only show "Authentication Required" if we've confirmed:
  // 1. No SSO token in URL
  // 2. No existing token
  // 3. Not currently loading/checking
  // 4. Not in the middle of an exchange
  if (!ssoToken && !token && !isLoading && !isInitializing && !authLoading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center justify-center text-center max-w-md px-6">
          <AlertTriangle className="h-16 w-16 text-yellow-500 mb-6" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Authentication Required</h1>
          <p className="text-gray-600 mb-4">
            You need to be logged in to access this page. Please log in to WordPress first, then click the dashboard link to access this application.
          </p>
          {redirectParam && (
            <p className="text-gray-500 text-sm mb-6">
              You were trying to access: <code className="bg-gray-100 px-2 py-1 rounded">{redirectParam}</code>
            </p>
          )}
          <p className="text-gray-500 text-sm">
            After logging in to WordPress, use the dashboard link to access this application with automatic authentication.
          </p>
        </div>
      </div>
    );
  }

  // Fallback: show loader if we're still processing
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-gray-50">
      <div className="flex flex-col items-center justify-center text-center max-w-500px">
        <Spinner className="h-16 w-16 text-green-600 mb-6" />
        <p className="text-gray-700 text-lg font-medium">Processing...</p>
        <p className="text-gray-500 text-sm mt-2">Please wait</p>
      </div>
    </div>
  );
}

