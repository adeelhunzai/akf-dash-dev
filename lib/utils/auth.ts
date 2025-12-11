import { UserRole } from '@/lib/types/roles';

/**
 * Public routes that don't require authentication
 * Only auth-related routes are public
 */
export const PUBLIC_ROUTES = [
  '/auth/callback',
  '/auth/login',
  '/auth/logout',
];

/**
 * Check if a pathname is the auth callback route
 * This is a more specific check to avoid redirect loops
 */
export function isAuthCallbackRoute(pathname: string): boolean {
  const normalizedPath = pathname.startsWith('/') ? pathname : `/${pathname}`;
  return normalizedPath === '/auth/callback' || normalizedPath.startsWith('/auth/callback?');
}

/**
 * Role-based route mapping
 */
export const ROLE_ROUTES: Record<UserRole, string[]> = {
  [UserRole.ADMIN]: ['/admin'],
  [UserRole.LEARNER]: ['/learner'],
  [UserRole.FACILITATOR]: ['/facilitator'],
  [UserRole.MANAGER]: ['/manager'],
};

/**
 * Check if a route is public (no auth required)
 */
export function isPublicRoute(pathname: string): boolean {
  // Normalize pathname - remove query params for comparison
  const pathWithoutQuery = pathname.split('?')[0];
  const normalizedPath = pathWithoutQuery.startsWith('/') ? pathWithoutQuery : `/${pathWithoutQuery}`;
  
  // Check if pathname matches any public route exactly or starts with it
  return PUBLIC_ROUTES.some(route => {
    // Exact match
    if (normalizedPath === route) return true;
    // Path starts with route followed by / (e.g., /auth/callback/something)
    if (normalizedPath.startsWith(route + '/')) return true;
    return false;
  });
}

/**
 * Get required role for a route
 */
export function getRequiredRoleForRoute(pathname: string): UserRole | null {
  if (pathname.includes('/admin')) return UserRole.ADMIN;
  if (pathname.includes('/learner')) return UserRole.LEARNER;
  if (pathname.includes('/facilitator')) return UserRole.FACILITATOR;
  if (pathname.includes('/manager')) return UserRole.MANAGER;
  return null;
}

/**
 * Check if user has access to a route based on their role
 * 
 * Access rules:
 * - Admins: access to all routes
 * - Managers: access to manager and learner routes
 * - Facilitators: access to facilitator and learner routes
 * - Learners: access to only learner routes
 */
export function hasRouteAccess(userRole: UserRole | null, pathname: string): boolean {
  // Public routes are accessible to everyone
  if (isPublicRoute(pathname)) return true;
  
  // If no role required, allow access (e.g., root dashboard page)
  const requiredRole = getRequiredRoleForRoute(pathname);
  if (!requiredRole) return true;
  
  // User must have a role
  if (!userRole) return false;
  
  // Admins have access to all routes
  if (userRole === UserRole.ADMIN) return true;
  
  // Learner routes are accessible to all authenticated users
  if (requiredRole === UserRole.LEARNER) return true;
  
  // Check if user's role matches required role
  return userRole === requiredRole;
}

/**
 * Get default dashboard path for a role
 */
export function getDefaultDashboardPath(role: UserRole, locale: string = 'en'): string {
  return `/${locale}${ROLE_ROUTES[role][0]}`;
}

