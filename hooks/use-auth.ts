"use client";

import { useAppSelector } from '@/lib/store/hooks';

/**
 * Hook to access the current authenticated user from Redux store.
 * User data is populated by AuthInitializer from WordPress API.
 */
export function useAuth() {
  const user = useAppSelector((state) => state.auth.user);
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);
  const loading = useAppSelector((state) => state.auth.loading);

  return { user, isAuthenticated, loading };
}
