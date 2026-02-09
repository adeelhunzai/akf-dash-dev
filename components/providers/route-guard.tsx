'use client';

import { useEffect, useState, useMemo } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useAppSelector } from '@/lib/store/hooks';
import { UserRole } from '@/lib/types/roles';
import { hasRouteAccess, getDefaultDashboardPath, isPublicRoute, isAuthCallbackRoute } from '@/lib/utils/auth';
import { useLocale } from 'next-intl';
import { ForbiddenAccess } from '@/components/ui/forbidden-access';
import { DashboardSkeleton } from '@/components/shared/layout/dashboard-skeleton';

interface RouteGuardProps {
  children: React.ReactNode;
}

/**
 * RouteGuard Component
 * Handles client-side route protection and role-based access control
 * This runs after middleware, providing fine-grained access control
 * 
 * Key improvement: Access is checked synchronously BEFORE rendering children
 * to prevent mount-then-redirect behavior
 */
export function RouteGuard({ children }: RouteGuardProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const locale = useLocale();
  const user = useAppSelector((state) => state.auth.user);
  const token = useAppSelector((state) => state.auth.token);
  const isLoading = useAppSelector((state) => state.auth.loading);
  const isLoggingOut = useAppSelector((state) => state.auth.isLoggingOut);
  const isInitializing = useAppSelector((state) => state.auth.isInitializing);
  const [loadingTimeout, setLoadingTimeout] = useState(false);
  const [hasRedirected, setHasRedirected] = useState(false);

  // Extract path without locale
  const pathWithoutLocale = pathname.replace(`/${locale}`, '') || '/';
  
  // Set a timeout for loading state (5 seconds)
  // IMPORTANT: All hooks must be called before any conditional returns
  useEffect(() => {
    if (isLoading) {
      const timer = setTimeout(() => {
        setLoadingTimeout(true);
      }, 30000); // 30 second timeout
      return () => clearTimeout(timer);
    } else {
      setLoadingTimeout(false);
    }
  }, [isLoading]);

  // Compute access status synchronously BEFORE rendering
  // This prevents children from mounting if access is denied
  const accessStatus = useMemo(() => {
    // Skip all checks for auth callback route
    if (isAuthCallbackRoute(pathWithoutLocale)) {
      return { canAccess: true, reason: 'auth_callback' };
    }

    // Skip all checks if logging out
    if (isLoggingOut) {
      return { canAccess: false, reason: 'logging_out' };
    }

    // Wait while initializing - don't make access decisions yet
    if (isInitializing) {
      return { canAccess: false, reason: 'initializing' };
    }
    
    // If SSO token is present in URL, we are likely in the middle of an exchange
    // Wait for SSOHandler to process it (or remove it if invalid)
    if (searchParams.get('sso_token') && !token) {
      return { canAccess: false, reason: 'sso_exchange' };
    }

    // Allow public routes
    if (isPublicRoute(pathWithoutLocale)) {
      return { canAccess: true, reason: 'public_route' };
    }

    // Check if cookie exists (might be in cookie but not in Redux yet)
    const cookieToken = typeof document !== 'undefined' 
      ? document.cookie.split('; ').find(row => row.startsWith('jwt_token='))?.split('=')[1]
      : null;

    // If no token in Redux or cookie, and not loading, deny access
    if (!token && !cookieToken) {
      // If still loading, wait
      if (isLoading && !loadingTimeout) {
        return { canAccess: false, reason: 'loading' };
      }
      // No token after loading completes
      return { canAccess: false, reason: 'no_token' };
    }

    // If cookie exists but token not in Redux yet, wait for AuthInitializer
    if (!token && cookieToken) {
      if (isLoading && !loadingTimeout) {
        return { canAccess: false, reason: 'loading' };
      }
      // If loading timeout, something went wrong
      if (loadingTimeout) {
        return { canAccess: false, reason: 'timeout' };
      }
      // Still waiting for token to be loaded into Redux
      return { canAccess: false, reason: 'loading' };
    }

    // If we have a token but no user yet, wait for AuthInitializer to load user
    if (token && !user) {
      if (isLoading && !loadingTimeout) {
        return { canAccess: false, reason: 'loading' };
      }
      // If loading timeout, something went wrong
      if (loadingTimeout) {
        return { canAccess: false, reason: 'timeout' };
      }
      // Still waiting for user to be loaded
      return { canAccess: false, reason: 'loading' };
    }

    // Check role-based access if we have a user
    if (user) {
      const hasAccess = hasRouteAccess(user.role, pathWithoutLocale);
      if (!hasAccess) {
        return { canAccess: false, reason: 'no_access', userRole: user.role };
      }
      return { canAccess: true, reason: 'authorized' };
    }

    // If we're still loading, wait
    if (isLoading && !loadingTimeout) {
      return { canAccess: false, reason: 'loading' };
    }

    // Default: deny access if we can't determine status
    return { canAccess: false, reason: 'unknown' };
  }, [
    pathWithoutLocale,
    isLoggingOut,
    isInitializing,
    token,
    user,
    isLoading,
    loadingTimeout,
    searchParams,
  ]);

  // Handle redirects in useEffect (but children won't render if access is denied)
  useEffect(() => {
    // Only redirect if access is denied due to role mismatch
    if (!accessStatus.canAccess && accessStatus.reason === 'no_access' && accessStatus.userRole && !hasRedirected) {
      const defaultPath = getDefaultDashboardPath(accessStatus.userRole, locale);
      setHasRedirected(true);
      router.replace(defaultPath);
    } else if (accessStatus.canAccess || accessStatus.reason !== 'no_access') {
      // Reset redirect flag if access is granted or reason changed
      setHasRedirected(false);
    }
  }, [accessStatus, locale, router, hasRedirected]);

  // Render based on access status - this happens synchronously BEFORE children render
  // This prevents the mount-then-redirect issue

  // Allow auth callback route
  if (accessStatus.reason === 'auth_callback') {
    return <>{children}</>;
  }

  // Show loading state while initializing
  if (accessStatus.reason === 'initializing') {
    return <DashboardSkeleton />;
  }

  // Show loading state during logout
  if (accessStatus.reason === 'logging_out') {
    return <DashboardSkeleton />;
  }

  // Show loading state during SSO exchange
  if (accessStatus.reason === 'sso_exchange') {
    return <DashboardSkeleton />;
  }

  // Show loading state while checking authentication
  if (accessStatus.reason === 'loading') {
    return <DashboardSkeleton />;
  }

  // Show loading state when redirecting due to role mismatch
  // This prevents showing the protected route content before redirect
  if (accessStatus.reason === 'no_access' && accessStatus.userRole) {
    return <DashboardSkeleton />;
  }

  // If loading timeout occurred, show forbidden access
  if (accessStatus.reason === 'timeout') {
    return (
      <ForbiddenAccess 
        message="Authentication is taking longer than expected. Please try refreshing the page."
        showHomeButton={false}
      />
    );
  }

  // If no token and not a public route, show forbidden access
  if (accessStatus.reason === 'no_token') {
    return (
      <ForbiddenAccess 
        message="You need to be authenticated to access this page. Please log in to WordPress first, then click the dashboard link to access this application with automatic authentication."
        showHomeButton={false}
      />
    );
  }

  // If access is denied for unknown reason, show forbidden access
  if (!accessStatus.canAccess && accessStatus.reason === 'unknown') {
    return (
      <ForbiddenAccess 
        message="You do not have permission to access this page. Please contact your administrator if you believe this is an error."
        showHomeButton={true}
      />
    );
  }

  // Access granted - render children
  // This only happens if accessStatus.canAccess is true
  if (accessStatus.canAccess) {
    return <>{children}</>;
  }

  // Fallback (should never reach here, but just in case)
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#16a34a] mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading...</p>
      </div>
    </div>
  );
}

