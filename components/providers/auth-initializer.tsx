'use client';

import { useEffect, useRef, useCallback } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/lib/store/hooks';
import { setUser, setLoading, initializeAuth, setInitializing, setToken, setWordpressUrl, logout } from '@/lib/store/slices/authSlice';
import { useGetCurrentUserQuery } from '@/lib/store/api/userApi';
import { useValidateTokenMutation } from '@/lib/store/api/authApi';
import { useGetGeneralSettingsQuery } from '@/lib/store/api/settingsApi';
import { UserRole, User } from '@/lib/types/roles';
import { WordPressUserResponse } from '@/lib/types/wordpress-user.types';
import { isAuthCallbackRoute } from '@/lib/utils/auth';
import { getUserIdCookie, getTokenCookie } from '@/lib/utils/cookies';
import { useLocale } from 'next-intl';

/**
 * Maps WordPress roles to application UserRole
 * Note: group_leader = FACILITATOR, group_leader_clone = MANAGER
 */
function mapWordPressRoleToUserRole(wpRoles: string[]): UserRole {
  // Priority order: admin > manager > facilitator > learner
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
  // Default to learner for subscribers and other roles
  return UserRole.LEARNER;
}

/**
 * Transforms WordPress user response to application User type
 */
function transformWordPressUser(wpUser: WordPressUserResponse): User {
  // Determine display name: prefer first_name + last_name, fallback to name, then username
  let displayName = wpUser.name;
  if (wpUser.first_name || wpUser.last_name) {
    displayName = `${wpUser.first_name} ${wpUser.last_name}`.trim();
  }
  if (!displayName || displayName === wpUser.email) {
    // If name is just the email, use a cleaner format
    displayName = wpUser.nickname || wpUser.username.split('@')[0];
  }

  return {
    id: String(wpUser.id),
    name: displayName,
    email: wpUser.email,
    role: mapWordPressRoleToUserRole(wpUser.roles),
    avatar: wpUser.avatar_urls?.['96'] || wpUser.avatar_urls?.['48'],
  };
}

interface AuthInitializerProps {
  children: React.ReactNode;
}

/**
 * AuthInitializer fetches the current user from WordPress API on mount
 * and populates the Redux auth state. This ensures user details are
 * available throughout the app when the user visits any page.
 */
export function AuthInitializer({ children }: AuthInitializerProps) {
  const dispatch = useAppDispatch();
  const pathname = usePathname();
  const locale = useLocale();
  const user = useAppSelector((state) => state.auth.user);
  const token = useAppSelector((state) => state.auth.token);
  const wordpressUrl = useAppSelector((state) => state.auth.wordpressUrl);
  const [validateToken] = useValidateTokenMutation();
  
  // Extract path without locale
  const pathWithoutLocale = pathname.replace(`/${locale}`, '') || '/';
  
  // Skip token validation on auth callback page - it handles its own authentication
  const isOnAuthCallback = isAuthCallbackRoute(pathWithoutLocale);
  
  // Initialize auth on mount (load token from cookie)
  // This must run first before any other auth checks
  useEffect(() => {
    dispatch(initializeAuth());
    // Note: isInitializing will be set to false after token validation completes
    // or immediately if no token is found (handled in initializeAuth and validation logic)
  }, [dispatch]);

  // Fetch general settings to get profile picture (admin-only API)
  // Only fetch for admin users, and only once per session
  // Skip on auth callback page or if user is not admin
  const isAdmin = user?.role === UserRole.ADMIN;
  const shouldFetchSettings = token && isAdmin && !isOnAuthCallback;
  const { data: generalSettings, refetch: refetchGeneralSettings } = useGetGeneralSettingsQuery(undefined, {
    skip: !shouldFetchSettings, // Only fetch if admin has token and not on auth callback
    refetchOnMountOrArgChange: false, // Don't refetch on route changes
    refetchOnFocus: false, // Don't refetch on window focus
    refetchOnReconnect: false, // Don't refetch on reconnect
  });

  // If we have a JWT token, validate it first
  // Skip validation on auth callback page - it handles its own authentication
  // Also skip if there's an SSO exchange happening for a different user (SSOHandler will handle it)
  const searchParams = useSearchParams();
  const ssoToken = searchParams.get('sso_token');
  const ssoUid = searchParams.get('uid');
  
  // Detect if SSOHandler should handle auth instead of us
  const cookieUserId = typeof window !== 'undefined' ? getUserIdCookie() : null;
  const isSSOUserSwitch = ssoToken && ssoUid && cookieUserId && String(cookieUserId) !== String(ssoUid);
  
  useEffect(() => {
    // Don't validate on auth callback page
    if (isOnAuthCallback) {
      // Ensure loading is false on auth callback page
      dispatch(setLoading(false));
      return;
    }
    
    // If there's an SSO exchange for a different user, skip validation
    // SSOHandler will clear the old session and establish a new one
    // But we MUST set isInitializing to false so SSOHandler can proceed
    if (isSSOUserSwitch) {
      dispatch(setLoading(false));
      dispatch(setInitializing(false));
      return;
    }
    
    if (token && !user) {
      // Set loading state while validating
      dispatch(setLoading(true));
      
      validateToken({})
        .unwrap()
        .then((response) => {
          if (response.success && response.valid) {
            // Store WordPress URL for logo link and logout redirect
            if (response.wordpress_url) {
              dispatch(setWordpressUrl(response.wordpress_url));
            }
            
            // Set user immediately with token validation response
            // Don't wait for generalSettings - we'll update avatar later if needed
            // setUser automatically sets loading to false
            const transformedUser: User = {
              id: String(response.user.id),
              name: response.user.display_name,
              email: response.user.email,
              role: mapWordPressRoleToUserRole(response.user.roles),
              avatar: response.user.avatar_url, // Use avatar from token validation initially
            };
            dispatch(setUser(transformedUser));
            dispatch(setInitializing(false));
          } else {
            // Token is invalid
            dispatch(setToken(null));
            dispatch(setLoading(false));
            dispatch(setInitializing(false));
          }
        })
        .catch((err) => {
          console.error('Token validation failed:', err);
          // Token is invalid, clear it
          dispatch(setToken(null));
          dispatch(setLoading(false));
          dispatch(setInitializing(false));
        });
    } else if (!token && !user) {
      // No token and no user - ensure loading is false
      dispatch(setLoading(false));
      dispatch(setInitializing(false));
    }
  }, [token, user, validateToken, dispatch, isOnAuthCallback, isSSOUserSwitch]);
  
  // Update avatar when general settings load (after user is already set)
  useEffect(() => {
    if (user && generalSettings?.data?.profilePicture !== undefined) {
      // Convert null to undefined for avatar (User type expects string | undefined)
      const newAvatar = generalSettings.data.profilePicture ?? undefined;
      // Only update if the avatar has actually changed
      if (user.avatar !== newAvatar) {
        dispatch(setUser({
          ...user,
          avatar: newAvatar,
        }));
      }
    }
  }, [generalSettings, user, dispatch]);

  // Check if we are in the middle of an SSO exchange
  // If sso_token is present, we should wait for SSOHandler to exchange it
  // and not try to fetch the current user yet (which would fail with 401)
  const isSSOExchange = !!ssoToken;

  // Fetch current user from WordPress API (fallback if no JWT)
  // Only skip if we already have user data loaded, have a token, are on auth callback,
  // or are in the middle of an SSO exchange
  const { data: wpUser, isLoading, isError, error } = useGetCurrentUserQuery(undefined, {
    skip: !!user || !!token || isOnAuthCallback || isSSOExchange,
  });

  // Only set loading from wpUser query if we're actually trying to fetch it
  useEffect(() => {
    // Don't set loading from wpUser query if we have a token (token validation handles loading)
    // Don't set loading if we're on auth callback
    if (!token && !isOnAuthCallback) {
      dispatch(setLoading(isLoading));
    }
  }, [isLoading, dispatch, token, isOnAuthCallback]);

  useEffect(() => {
    if (wpUser && !user && !token) {
      const transformedUser = transformWordPressUser(wpUser);
      console.log('Setting user in Redux:', transformedUser);
      dispatch(setUser(transformedUser));
      dispatch(setInitializing(false));
    }
  }, [wpUser, user, token, dispatch]);

  useEffect(() => {
    if (isError) {
      console.error('Failed to fetch current user:', error);
      // If we failed to fetch user and have no token, ensure loading is false
      if (!token) {
        dispatch(setLoading(false));
        dispatch(setInitializing(false));
      }
    }
  }, [isError, error, token, dispatch]);

  // --- Periodic token re-validation ---
  // This catches WordPress-side logouts (token revoked in DB) even if the
  // user keeps the Next.js tab open. Validates every 5 minutes and on tab focus.
  const REVALIDATION_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes
  const lastValidationRef = useRef<number>(Date.now());
  const [revalidateToken] = useValidateTokenMutation({ fixedCacheKey: 'periodic-revalidation' });

  const performRevalidation = useCallback(() => {
    if (!token || !user || isOnAuthCallback) return;

    revalidateToken({})
      .unwrap()
      .then((response) => {
        if (!response.success || !response.valid) {
          // Token was revoked — clear the session
          console.warn('Periodic revalidation: token revoked, logging out');
          dispatch(logout());
        }
        lastValidationRef.current = Date.now();
      })
      .catch(() => {
        // 401 means token is invalid/revoked
        console.warn('Periodic revalidation failed, logging out');
        dispatch(logout());
        lastValidationRef.current = Date.now();
      });
  }, [token, user, isOnAuthCallback, revalidateToken, dispatch]);

  // Interval-based periodic re-validation
  useEffect(() => {
    if (!token || !user || isOnAuthCallback) return;

    const interval = setInterval(() => {
      performRevalidation();
    }, REVALIDATION_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [token, user, isOnAuthCallback, performRevalidation]);

  // Visibility-change cookie check (when user switches back to this tab)
  // Since cookies are shared across all tabs on the same domain, when the
  // logout page removes the jwt_token cookie, ALL tabs lose it instantly.
  // We just check if the cookie disappeared while Redux still has a token.
  useEffect(() => {
    if (isOnAuthCallback) return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && token) {
        const cookieToken = getTokenCookie();
        if (!cookieToken) {
          // Cookie was removed by another tab (logout page) — clear Redux & redirect
          console.warn('Cookie removed by another tab, logging out and redirecting');
          dispatch(logout());
          // Redirect to WordPress login page
          const wpUrl = wordpressUrl || '';
          if (wpUrl) {
            window.location.href = wpUrl;
          } else {
            // Fallback: reload to trigger RouteGuard's no_token state
            window.location.reload();
          }
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [token, isOnAuthCallback, dispatch]);

  return <>{children}</>;
}
