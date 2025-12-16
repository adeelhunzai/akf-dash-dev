import { createApi } from '@reduxjs/toolkit/query/react';
import { createWordpressBaseQuery } from '@/lib/api/wordpressBaseQuery';
import { WordPressUserResponse, UsersCountResponse, CourseCompletionRateResponse, TopCoursesResponse, UsersListResponse, UserDetailsResponse, CreateUserRequest, CreateUserResponse, UpdateUserRequest, UpdateUserResponse, DeleteUserRequest, DeleteUserResponse, LearnerDashboardResponse } from '@/lib/types/wordpress-user.types';

export const usersApi = createApi({
  reducerPath: 'usersApi',
  baseQuery: createWordpressBaseQuery('token'),
  tagTypes: ['CurrentUser', 'UsersCount', 'CourseCompletionRate', 'TopCourses', 'UsersList', 'UserDetails', 'LearnerDashboard'],
  endpoints: (build) => ({
    getCurrentUser: build.query<WordPressUserResponse, void>({
      query: () => '/wp/v2/users/me?context=edit',
      providesTags: ['CurrentUser'],
    }),
    getUsersCount: build.query<UsersCountResponse, string | undefined>({
      query: (period) => {
        const params = new URLSearchParams();
        if (period) {
          params.append('period', period);
        }
        const queryString = params.toString();
        return `/custom-api/v1/users-count${queryString ? `?${queryString}` : ''}`;
      },
      providesTags: ['UsersCount'],
    }),
    getCourseCompletionRate: build.query<CourseCompletionRateResponse, string | undefined>({
      query: (period) => {
        const params = new URLSearchParams();
        if (period) {
          params.append('period', period);
        }
        const queryString = params.toString();
        return `/custom-api/v1/course-completion-rate${queryString ? `?${queryString}` : ''}`;
      },
      providesTags: ['CourseCompletionRate'],
    }),
    getTopCourses: build.query<TopCoursesResponse, string | undefined>({
      query: (period) => {
        const params = new URLSearchParams();
        if (period) {
          params.append('period', period);
        }
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
    getLearnerDashboard: build.query<LearnerDashboardResponse, string | undefined>({
      query: (period) => {
        const params = new URLSearchParams();
        if (period) {
          params.append('period', period);
        }
        const queryString = params.toString();
        return `/custom-api/v1/learner-dashboard${queryString ? `?${queryString}` : ''}`;
      },
      // Serialize query args to ensure consistent caching
      serializeQueryArgs: ({ endpointName, queryArgs }) => {
        const period = queryArgs || '';
        // Consistent serialization ensures RTK Query caches properly
        return `${endpointName}(${period})`;
      },
      providesTags: ['LearnerDashboard'],
      // Keep cached data for 5 minutes to prevent unnecessary refetches
      keepUnusedDataFor: 300,
    }),
  }),
});

export const { useGetCurrentUserQuery, useGetUsersCountQuery, useGetCourseCompletionRateQuery, useGetTopCoursesQuery, useGetUsersListQuery, useGetUserDetailsQuery, useUpdateUserMutation, useCreateUserMutation, useDeleteUserMutation, useGetLearnerDashboardQuery } = usersApi;