import { createApi } from '@reduxjs/toolkit/query/react';
import { createWordpressBaseQuery } from '@/lib/api/wordpressBaseQuery';
import {
  GeneralSettings,
  GeneralSettingsResponse,
  CourseSettings,
  CourseSettingsResponse,
  LoginSessionsResponse,
} from '@/lib/types/settings.types';

export const settingsApi = createApi({
  reducerPath: 'settingsApi',
  baseQuery: createWordpressBaseQuery('token'),
  tagTypes: ['GeneralSettings', 'CourseSettings', 'LoginSessions'],
  endpoints: (build) => ({
    // General Settings
    getGeneralSettings: build.query<GeneralSettingsResponse, void>({
      query: () => '/custom-api/v1/settings/general',
      providesTags: ['GeneralSettings'],
    }),
    updateGeneralSettings: build.mutation<GeneralSettingsResponse, Partial<GeneralSettings>>({
      query: (data) => ({
        url: '/custom-api/v1/settings/general',
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['GeneralSettings'],
      // Refetch general settings after update to ensure header gets updated avatar
      async onQueryStarted(arg, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
          // The invalidatesTags will automatically trigger a refetch
          // which will update the user avatar in AuthInitializer
        } catch (error) {
          // Error handling is done by the mutation
        }
      },
    }),

    // Course Settings
    getCourseSettings: build.query<CourseSettingsResponse, void>({
      query: () => '/custom-api/v1/settings/course',
      providesTags: ['CourseSettings'],
    }),
    updateCourseSettings: build.mutation<CourseSettingsResponse, Partial<CourseSettings>>({
      query: (data) => ({
        url: '/custom-api/v1/settings/course',
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['CourseSettings'],
    }),

    // Login Sessions
    getLoginSessions: build.query<LoginSessionsResponse, void>({
      query: () => '/custom-api/v1/sessions',
      providesTags: ['LoginSessions'],
    }),
    deleteLoginSession: build.mutation<{ success: boolean; message: string }, string>({
      query: (sessionId) => ({
        url: `/custom-api/v1/sessions/${sessionId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['LoginSessions'],
    }),
    logoutAllSessions: build.mutation<{ success: boolean; message: string }, void>({
      query: () => ({
        url: '/custom-api/v1/sessions/logout-all',
        method: 'POST',
      }),
      invalidatesTags: ['LoginSessions'],
    }),
  }),
});

export const {
  useGetGeneralSettingsQuery,
  useUpdateGeneralSettingsMutation,
  useGetCourseSettingsQuery,
  useUpdateCourseSettingsMutation,
  useGetLoginSessionsQuery,
  useDeleteLoginSessionMutation,
  useLogoutAllSessionsMutation,
} = settingsApi;


