import { createApi } from '@reduxjs/toolkit/query/react';
import { createWordpressBaseQuery } from '@/lib/api/wordpressBaseQuery';

export interface SSOExchangeRequest {
  token: string;
}

export interface SSOExchangeResponse {
  success: boolean;
  token: string;
  expires_in: number;
  wordpress_url?: string;
  user: {
    id: number;
    email: string;
    display_name: string;
    roles: string[];
    avatar_url: string;
  };
}

export interface ValidateTokenResponse {
  success: boolean;
  valid: boolean;
  wordpress_url?: string;
  user: {
    id: number;
    email: string;
    display_name: string;
    roles: string[];
    avatar_url: string;
  };
}

export interface RefreshTokenResponse {
  success: boolean;
  token: string;
  expires_in: number;
}

// Create separate base queries for different auth needs
const noAuthBaseQuery = createWordpressBaseQuery('none');
const tokenAuthBaseQuery = createWordpressBaseQuery('token');

export const authApi = createApi({
  reducerPath: 'authApi',
  baseQuery: (args, api, extraOptions) => {
    // Use no-auth for SSO exchange, token auth for others
    if (args.url === '/custom-api/v1/auth/exchange-token') {
      return noAuthBaseQuery(args, api, extraOptions);
    }
    return tokenAuthBaseQuery(args, api, extraOptions);
  },
  tagTypes: ['Auth'],
  endpoints: (build) => ({
    exchangeSSOToken: build.mutation<SSOExchangeResponse, SSOExchangeRequest>({
      query: (body) => ({
        url: '/custom-api/v1/auth/exchange-token',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Auth'],
    }),
    validateToken: build.mutation<ValidateTokenResponse, { token?: string }>({
      query: (body) => ({
        url: '/custom-api/v1/auth/validate',
        method: 'POST',
        body: body.token ? { token: body.token } : {},
      }),
      // Use token auth - WordPress will get token from Authorization header or body
    }),
    refreshToken: build.mutation<RefreshTokenResponse, { token?: string }>({
      query: (body) => ({
        url: '/custom-api/v1/auth/refresh',
        method: 'POST',
        body: body.token ? { token: body.token } : {},
      }),
      // Use token auth - WordPress will get token from Authorization header or body
    }),
    revokeToken: build.mutation<{ success: boolean; message: string }, { token?: string }>({
      query: (body) => ({
        url: '/custom-api/v1/auth/revoke',
        method: 'POST',
        body: body.token ? { token: body.token } : {},
      }),
      // Use token auth - WordPress will get token from Authorization header or body
    }),
  }),
});

export const {
  useExchangeSSOTokenMutation,
  useValidateTokenMutation,
  useRefreshTokenMutation,
  useRevokeTokenMutation,
} = authApi;

