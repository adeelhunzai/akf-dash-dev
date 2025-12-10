# Route Protection & Role-Based Authorization Implementation

## Overview
This document describes the implementation of cookie-based authentication with route protection and role-based access control.

## Implementation Details

### 1. Cookie-Based Token Storage

**File**: `lib/utils/cookies.ts`
- Created utility functions for managing JWT tokens in cookies
- Uses `js-cookie` library for cookie management
- Cookie configuration:
  - `secure: true` in production (HTTPS only)
  - `sameSite: 'strict'` (CSRF protection)
  - `expires: 2 hours` (matches JWT expiration)
  - `path: '/'` (available site-wide)

**Benefits over localStorage**:
- Better security with `secure` and `sameSite` flags
- Accessible from server-side (middleware)
- Automatic expiration handling
- More secure than localStorage for sensitive data

### 2. Redux State Updates

**File**: `lib/store/slices/authSlice.ts`
- Updated `setToken()` to use cookies instead of localStorage
- Updated `logout()` to remove token from cookies
- Updated `initializeAuth()` to load token from cookies
- Token is now stored in both Redux state and cookies for consistency

### 3. Middleware Route Protection

**File**: `middleware.ts`
- Enhanced Next.js middleware to check authentication
- Reads JWT token from cookies
- Redirects unauthenticated users to `/auth/callback`
- Preserves intended destination via `redirect` query parameter
- Works in conjunction with `next-intl` middleware

**How it works**:
1. Checks if route is public (no auth required)
2. If protected route and no token → redirect to auth callback
3. If token exists → allow access (role validation happens client-side)

### 4. Client-Side Route Guard

**File**: `components/providers/route-guard.tsx`
- Fine-grained role-based access control
- Checks user role against route requirements
- Redirects unauthorized users to their default dashboard
- Shows loading state during authentication check

**Role-Based Access Rules**:
- **ADMIN**: Access to all routes (including `/admin/*`)
- **LEARNER**: Only `/learner/*` routes
- **FACILITATOR**: Only `/facilitator/*` routes
- **MANAGER**: Only `/manager/*` routes

### 5. Route Protection Utilities

**File**: `lib/utils/auth.ts`
- `isPublicRoute()`: Check if route is public
- `getRequiredRoleForRoute()`: Get required role for a route
- `hasRouteAccess()`: Check if user has access to route
- `getDefaultDashboardPath()`: Get default dashboard for role

### 6. Auth Callback Updates

**File**: `app/[locale]/auth/callback/page.tsx`
- Handles `redirect` query parameter from middleware
- Redirects to originally requested path after authentication
- Falls back to role-based default dashboard if no redirect

## Route Protection Flow

```
1. User accesses protected route
   ↓
2. Middleware checks for JWT token in cookies
   ↓
3. No token? → Redirect to /auth/callback?redirect=/original-path
   ↓
4. Token exists? → Allow request to proceed
   ↓
5. RouteGuard (client-side) checks user role
   ↓
6. Role matches route? → Allow access
   ↓
7. Role doesn't match? → Redirect to user's default dashboard
```

## Public Routes

Routes that don't require authentication:
- `/auth/callback` - Authentication callback handler
- `/auth/login` - Login page (if implemented)
- `/auth/logout` - Logout handler (if implemented)

## Role-Based Route Mapping

| Role | Allowed Routes |
|------|---------------|
| ADMIN | `/admin/*` (plus all other routes) |
| LEARNER | `/learner/*` |
| FACILITATOR | `/facilitator/*` |
| MANAGER | `/manager/*` |

## Installation Required

Before running the application, install the cookie library:

```bash
npm install js-cookie @types/js-cookie
```

## Security Features

1. **Cookie Security Flags**:
   - `secure`: Only sent over HTTPS in production
   - `sameSite: 'strict'`: Prevents CSRF attacks
   - Automatic expiration after 2 hours

2. **Multi-Layer Protection**:
   - Middleware: Server-side token check
   - RouteGuard: Client-side role validation
   - API calls: Token validation on every request

3. **Automatic Redirects**:
   - Unauthenticated → Auth callback
   - Wrong role → User's default dashboard
   - Preserves intended destination

## Testing Checklist

- [ ] Unauthenticated user accessing protected route → Redirects to auth
- [ ] Authenticated user accessing their role's route → Allowed
- [ ] Authenticated user accessing different role's route → Redirects to their dashboard
- [ ] Admin accessing any route → Allowed
- [ ] Token expiration → Redirects to auth
- [ ] Public routes → Accessible without auth
- [ ] Redirect parameter → Preserves intended destination

## Future Enhancements

1. Token refresh mechanism
2. Remember me functionality (longer cookie expiration)
3. Session management (multiple devices)
4. Permission-based access (granular permissions per route)
5. Audit logging for access attempts



