import { createApi } from '@reduxjs/toolkit/query/react';
import { createWordpressBaseQuery } from '@/lib/api/wordpressBaseQuery';
import { WordPressUserResponse, UsersCountResponse, CourseCompletionRateResponse, TopCoursesResponse, UsersListResponse, UserDetailsResponse, CreateUserRequest, CreateUserResponse, UpdateUserRequest, UpdateUserResponse, DeleteUserRequest, DeleteUserResponse, LearnerDashboardResponse, FilterUsersByCsvResponse, LearnerAchievementsResponse, LearnerCertificatesResponse, CertificateDownloadResponse, CertificateViewResponse, LearnerSettingsResponse, UpdateLearnerSettingsRequest, UpdateLearnerSettingsResponse } from '@/lib/types/wordpress-user.types';

export interface MetricsQueryArgs {
  period?: string;
  from?: string;
  to?: string;
}

export const usersApi = createApi({
  reducerPath: 'usersApi',
  baseQuery: createWordpressBaseQuery('token'),
  tagTypes: ['CurrentUser', 'UsersCount', 'CourseCompletionRate', 'TopCourses', 'UsersList', 'UserDetails', 'LearnerDashboard', 'LearnerAchievements', 'LearnerCertificates', 'LearnerSettings'],
  endpoints: (build) => ({
    getCurrentUser: build.query<WordPressUserResponse, void>({
      query: () => '/wp/v2/users/me?context=edit',
      providesTags: ['CurrentUser'],
    }),
    getUsersCount: build.query<UsersCountResponse, MetricsQueryArgs | void>({
      query: ({ period, from, to } = {}) => {
        const params = new URLSearchParams();
        if (period) params.append('period', period);
        if (from) params.append('from', from);
        if (to) params.append('to', to);
        const queryString = params.toString();
        return `/custom-api/v1/users-count${queryString ? `?${queryString}` : ''}`;
      },
      providesTags: ['UsersCount'],
    }),
    getCourseCompletionRate: build.query<CourseCompletionRateResponse, MetricsQueryArgs | void>({
      query: ({ period, from, to } = {}) => {
        const params = new URLSearchParams();
        if (period) params.append('period', period);
        if (from) params.append('from', from);
        if (to) params.append('to', to);
        const queryString = params.toString();
        return `/custom-api/v1/course-completion-rate${queryString ? `?${queryString}` : ''}`;
      },
      providesTags: ['CourseCompletionRate'],
    }),
    getTopCourses: build.query<TopCoursesResponse, MetricsQueryArgs | void>({
      query: ({ period, from, to } = {}) => {
        const params = new URLSearchParams();
        if (period) params.append('period', period);
        if (from) params.append('from', from);
        if (to) params.append('to', to);
        const queryString = params.toString();
        return `/custom-api/v1/top-courses${queryString ? `?${queryString}` : ''}`;
      },
      providesTags: ['TopCourses'],
    }),
    getUsersList: build.query<UsersListResponse, { page: number; per_page?: number; search?: string; role?: string }>({
      query: ({ page, per_page = 5, search, role }) => {
        const params = new URLSearchParams({ 
          page: page.toString(),
          per_page: per_page.toString()
        });
        if (search) params.append('search', search);
        if (role && role !== 'all') params.append('role', role);
        return `/custom-api/v1/users/list?${params.toString()}`;
      },
      providesTags: ['UsersList'],
      keepUnusedDataFor: 300,
    }),
    getUserDetails: build.query<UserDetailsResponse, number>({
      query: (userId) => `/custom-api/v1/users/${userId}`,
      providesTags: (result, error, userId) => [{ type: 'UserDetails', id: userId }],
    }),
    updateUser: build.mutation<UpdateUserResponse, UpdateUserRequest>({
      query: ({ userId, ...body }) => ({
        url: `/custom-api/v1/users/${userId}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: (result, error, { userId }) => [
        { type: 'UserDetails', id: userId },
        'UsersList',
      ],
    }),
    createUser: build.mutation<CreateUserResponse, CreateUserRequest>({
      query: (body) => ({
        url: '/wp/v2/users',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['UsersList', 'UsersCount'],
    }),
    deleteUser: build.mutation<DeleteUserResponse, DeleteUserRequest>({
      query: ({ userId }) => ({
        url: `/custom-api/v1/users/${userId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['UsersList', 'UsersCount'],
    }),
    getLearnerDashboard: build.query<LearnerDashboardResponse, string | MetricsQueryArgs | undefined>({
      query: (arg) => {
        const params = new URLSearchParams();
        if (typeof arg === 'string') {
          params.append('period', arg);
        } else if (arg) {
          if (arg.period) params.append('period', arg.period);
          if (arg.from) params.append('from', arg.from);
          if (arg.to) params.append('to', arg.to);
        }
        const queryString = params.toString();
        return `/custom-api/v1/learner-dashboard${queryString ? `?${queryString}` : ''}`;
      },
      providesTags: ['LearnerDashboard'],
      // Keep cached data for 5 minutes to prevent unnecessary refetches
      keepUnusedDataFor: 300,
    }),
    getLearnerAchievements: build.query<LearnerAchievementsResponse, void>({
      query: () => '/custom-api/v1/learner-achievements',
      providesTags: ['LearnerAchievements'],
      keepUnusedDataFor: 300,
    }),
    getLearnerCertificates: build.query<LearnerCertificatesResponse, void>({
      query: () => '/custom-api/v1/learner-certificates',
      providesTags: ['LearnerCertificates'],
      keepUnusedDataFor: 300,
    }),
    getCertificateDownload: build.query<CertificateDownloadResponse, string>({
      query: (certificateId) => `/custom-api/v1/learner-certificates/${certificateId}/download`,
    }),
    getCertificateView: build.query<CertificateViewResponse, string>({
      query: (certificateId) => `/custom-api/v1/learner-certificates/${certificateId}/view`,
    }),
    getLearnerSettings: build.query<LearnerSettingsResponse, void>({
      query: () => '/custom-api/v1/learner-settings',
      providesTags: ['LearnerSettings'],
    }),
    updateLearnerSettings: build.mutation<UpdateLearnerSettingsResponse, UpdateLearnerSettingsRequest>({
      query: (body) => ({
        url: '/custom-api/v1/learner-settings',
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['LearnerSettings', 'CurrentUser'],
    }),
    filterUsersByCsv: build.mutation<FilterUsersByCsvResponse, FormData>({
      query: (formData) => ({
        url: '/custom-api/v1/users/filter-by-csv',
        method: 'POST',
        body: formData,
        formData: true,
      }),
    }),
  }),
});

export const { 
  useGetCurrentUserQuery, 
  useGetUsersCountQuery, 
  useGetCourseCompletionRateQuery, 
  useGetTopCoursesQuery, 
  useGetUsersListQuery, 
  useGetUserDetailsQuery, 
  useUpdateUserMutation, 
  useCreateUserMutation, 
  useDeleteUserMutation, 
  useGetLearnerDashboardQuery, 
  useGetLearnerAchievementsQuery,
  useGetLearnerCertificatesQuery,
  useGetLearnerSettingsQuery,
  useUpdateLearnerSettingsMutation,
  useFilterUsersByCsvMutation 
} = usersApi;