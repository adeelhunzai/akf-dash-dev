'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAppSelector } from '@/lib/store/hooks';
import { UserRole } from '@/lib/types/roles';
import { hasRouteAccess, getDefaultDashboardPath, isPublicRoute, isAuthCallbackRoute } from '@/lib/utils/auth';
import { useLocale } from 'next-intl';
import { ForbiddenAccess } from '@/components/ui/forbidden-access';

interface RouteGuardProps {
  children: React.ReactNode;
}

/**
 * RouteGuard Component
 * Handles client-side route protection and role-based access control
 * This runs after middleware, providing fine-grained access control
 */
export function RouteGuard({ children }: RouteGuardProps) {
  const pathname = usePathname();
  const router = useRouter();
  const locale = useLocale();
  const user = useAppSelector((state) => state.auth.user);
  const token = useAppSelector((state) => state.auth.token);
  const isLoading = useAppSelector((state) => state.auth.loading);
  const isLoggingOut = useAppSelector((state) => state.auth.isLoggingOut);
  const [loadingTimeout, setLoadingTimeout] = useState(false);

  // Extract path without locale
  const pathWithoutLocale = pathname.replace(`/${locale}`, '') || '/';

  // Skip all checks for auth callback route - it handles its own authentication
  if (isAuthCallbackRoute(pathWithoutLocale)) {
    return <>{children}</>;
  }

  // Set a timeout for loading state (5 seconds)
  useEffect(() => {
    if (isLoading) {
      const timer = setTimeout(() => {
        setLoadingTimeout(true);
      }, 5000); // 5 second timeout
      return () => clearTimeout(timer);
    } else {
      setLoadingTimeout(false);
    }
  }, [isLoading]);

  useEffect(() => {
    // Skip all checks if logging out
    if (isLoggingOut) return;

    // Don't check routes while loading (unless timeout)
    // Give AuthInitializer time to load token from cookie (especially in new tabs)
    if (isLoading && !loadingTimeout) return;

    // Allow public routes - middleware already handles these, but we check here too for safety
    if (isPublicRoute(pathWithoutLocale)) {
      return;
    }

    // If no token and not a public route, check cookie directly (for new tabs)
    // This handles the case where a new tab opens and Redux hasn't initialized yet
    if (!token) {
      // Check if cookie exists (might be in cookie but not in Redux yet)
      const cookieToken = typeof document !== 'undefined' 
        ? document.cookie.split('; ').find(row => row.startsWith('jwt_token='))?.split('=')[1]
        : null;
      
      // If cookie exists, wait for AuthInitializer to load it and validate
      // This prevents redirect loops when opening new tabs or hard refreshing
      if (cookieToken) {
        // Cookie exists, wait for AuthInitializer to process it
        // Don't redirect - let AuthInitializer handle token validation
        return;
      }
      
      // No token in Redux or cookie
      // Don't redirect here - middleware already handles redirects
      // Just return and let the render logic show ForbiddenAccess
      return;
    }

    // If no user data but have token, wait for AuthInitializer to load user
    // But if timeout occurred, show forbidden access
    if (!user && token) {
      if (loadingTimeout) {
        // Loading took too long, likely an authentication issue
        return;
      }
      // AuthInitializer will load user data
      return;
    }

    // Check role-based access
    if (user) {
      const hasAccess = hasRouteAccess(user.role, pathWithoutLocale);
      
      if (!hasAccess) {
        // User doesn't have access to this route
        // Redirect to their default dashboard
        const defaultPath = getDefaultDashboardPath(user.role, locale);
        router.replace(defaultPath);
        return;
      }
    }
  }, [pathname, user, token, isLoading, loadingTimeout, locale, router, pathWithoutLocale, isLoggingOut]);

  // Show loading state during logout (prevents ForbiddenAccess flash)
  if (isLoggingOut) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#16a34a] mx-auto"></div>
          <p className="mt-4 text-gray-600">Logging out...</p>
        </div>
      </div>
    );
  }

  // Show loading state while checking authentication (with timeout)
  if (isLoading && !loadingTimeout) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#16a34a] mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // If loading timeout occurred, show forbidden access
  if (loadingTimeout && !isLoading) {
    return (
      <ForbiddenAccess 
        message="Authentication is taking longer than expected. Please try refreshing the page."
        showHomeButton={false}
      />
    );
  }

  // If no token and not a public route, show forbidden access
  // Authentication is SSO-only - users must log in via WordPress and click dashboard link
  // Skip this check if logging out (to prevent ForbiddenAccess flash)
  if (!token && !isPublicRoute(pathWithoutLocale) && !isLoading && !isLoggingOut) {
    // Check cookie one more time - if it exists, wait a bit more for AuthInitializer
    const cookieToken = typeof document !== 'undefined' 
      ? document.cookie.split('; ').find(row => row.startsWith('jwt_token='))?.split('=')[1]
      : null;
    
    if (!cookieToken) {
      // No cookie - show forbidden access with message about SSO authentication
      return (
        <ForbiddenAccess 
          message="You need to be authenticated to access this page. Please log in to WordPress first, then click the dashboard link to access this application with automatic authentication."
          showHomeButton={false}
        />
      );
    }
    // Cookie exists, wait a bit more for AuthInitializer to process it
    return null;
  }

  // If user doesn't have access, show forbidden access
  if (user && !hasRouteAccess(user.role, pathWithoutLocale)) {
    return (
      <ForbiddenAccess 
        message="You do not have permission to access this page. Please contact your administrator if you believe this is an error."
        showHomeButton={true}
      />
    );
  }

  return <>{children}</>;
}

