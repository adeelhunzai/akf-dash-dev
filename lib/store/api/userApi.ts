import { createApi } from '@reduxjs/toolkit/query/react';
import { createWordpressBaseQuery } from '@/lib/api/wordpressBaseQuery';
import { WordPressUserResponse, UsersCountResponse, CourseCompletionRateResponse, TopCoursesResponse, UsersListResponse, UserDetailsResponse, UpdateUserRequest, UpdateUserResponse, DeleteUserRequest, DeleteUserResponse } from '@/lib/types/wordpress-user.types';

export const usersApi = createApi({
  reducerPath: 'usersApi',
  baseQuery: createWordpressBaseQuery('token'),
  tagTypes: ['CurrentUser', 'UsersCount', 'CourseCompletionRate', 'TopCourses', 'UsersList', 'UserDetails'],
  endpoints: (build) => ({
    getCurrentUser: build.query<WordPressUserResponse, void>({
      query: () => '/wp/v2/users/me?context=edit',
      providesTags: ['CurrentUser'],
    }),
    getUsersCount: build.query<UsersCountResponse, void>({
      query: () => '/custom-api/v1/users-count',
      providesTags: ['UsersCount'],
    }),
    getCourseCompletionRate: build.query<CourseCompletionRateResponse, void>({
      query: () => '/custom-api/v1/course-completion-rate',
      providesTags: ['CourseCompletionRate'],
    }),
    getTopCourses: build.query<TopCoursesResponse, void>({
      query: () => '/custom-api/v1/top-courses',
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
    deleteUser: build.mutation<DeleteUserResponse, DeleteUserRequest>({
      query: ({ userId }) => ({
        url: `/custom-api/v1/users/${userId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['UsersList', 'UsersCount'],
    }),
  }),
});

export const { useGetCurrentUserQuery, useGetUsersCountQuery, useGetCourseCompletionRateQuery, useGetTopCoursesQuery, useGetUsersListQuery, useGetUserDetailsQuery, useUpdateUserMutation, useDeleteUserMutation } = usersApi;