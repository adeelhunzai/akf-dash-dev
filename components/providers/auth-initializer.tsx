'use client';

import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/lib/store/hooks';
import { setUser, setLoading, initializeAuth, setInitializing, setToken, setWordpressUrl } from '@/lib/store/slices/authSlice';
import { useGetCurrentUserQuery } from '@/lib/store/api/userApi';
import { useValidateTokenMutation } from '@/lib/store/api/authApi';
import { useGetGeneralSettingsQuery } from '@/lib/store/api/settingsApi';
import { UserRole, User } from '@/lib/types/roles';
import { WordPressUserResponse } from '@/lib/types/wordpress-user.types';
import { isAuthCallbackRoute } from '@/lib/utils/auth';
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
  useEffect(() => {
    // Don't validate on auth callback page
    if (isOnAuthCallback) {
      // Ensure loading is false on auth callback page
      dispatch(setLoading(false));
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
  }, [token, user, validateToken, dispatch, isOnAuthCallback]);
  
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
  const searchParams = useSearchParams();
  const isSSOExchange = !!searchParams.get('sso_token');

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

  return <>{children}</>;
}
