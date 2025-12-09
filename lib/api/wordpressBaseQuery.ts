import { fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { RootState } from '@/lib/store';
import {
  WORDPRESS_API_URL,
  WORDPRESS_ADMIN_USERNAME,
  WORDPRESS_ADMIN_PASSWORD,
  WORDPRESS_LEARNER_USERNAME,
  WORDPRESS_LEARNER_PASSWORD,
} from '@/lib/config/wordpress.config';

export type AuthMode = 'admin-basic' | 'learner-basic' | 'token' | 'none';

export const createWordpressBaseQuery = (authMode: AuthMode) =>
  fetchBaseQuery({
    baseUrl: WORDPRESS_API_URL,
    prepareHeaders: (headers, api) => {
      const state = api.getState() as RootState;

      // Set Content-Type for POST requests
      headers.set('Content-Type', 'application/json');

      if (authMode === 'token') {
        const token = state.auth?.token;
        if (token) {
          headers.set('Authorization', `Bearer ${token}`);
        }
      } else if (authMode === 'admin-basic') {
        const token = btoa(
          `${WORDPRESS_ADMIN_USERNAME}:${WORDPRESS_ADMIN_PASSWORD}`,
        );
        headers.set('Authorization', `Basic ${token}`);
      } else if (authMode === 'learner-basic') {
        const token = btoa(
          `${WORDPRESS_LEARNER_USERNAME}:${WORDPRESS_LEARNER_PASSWORD}`,
        );
        headers.set('Authorization', `Basic ${token}`);
      }
      // 'none' mode doesn't set any auth headers (for public endpoints like SSO exchange)

      return headers;
    },
  });