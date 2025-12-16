import { createApi } from '@reduxjs/toolkit/query/react';
import { createWordpressBaseQuery } from '@/lib/api/wordpressBaseQuery';
import { CoursesListResponse, MyCoursesResponse } from '@/lib/types/courses.types';

export const coursesApi = createApi({
  reducerPath: 'coursesApi',
  baseQuery: createWordpressBaseQuery('token'),
  tagTypes: ['CoursesList', 'MyCourses'],
  endpoints: (build) => ({
    getCoursesList: build.query<CoursesListResponse, { page?: number; per_page?: number; search?: string }>({
      query: ({ page = 1, per_page = 100, search }) => {
        const params = new URLSearchParams({ 
          page: page.toString(),
          per_page: per_page.toString()
        });
        if (search) params.append('search', search);
        return `/custom-api/v1/courses?${params.toString()}`;
      },
      providesTags: ['CoursesList'],
    }),
    getMyCourses: build.query<MyCoursesResponse, { 
      page?: number; 
      per_page?: number; 
      status?: 'all' | 'in-progress' | 'completed';
      search?: string;
    }>({
      query: ({ page = 1, per_page = 12, status = 'all', search }) => {
        const params = new URLSearchParams({ 
          page: page.toString(),
          per_page: per_page.toString(),
          status: status
        });
        if (search) params.append('search', search);
        return `/custom-api/v1/my-courses?${params.toString()}`;
      },
      // Serialize query args to ensure consistent caching
      serializeQueryArgs: ({ endpointName, queryArgs }) => {
        const { page = 1, per_page = 12, status = 'all', search = '' } = queryArgs;
        // Consistent serialization ensures RTK Query caches properly
        return `${endpointName}(${page},${per_page},${status},${search})`;
      },
      providesTags: ['MyCourses'],
      // Keep cached data for 5 minutes to prevent unnecessary refetches
      keepUnusedDataFor: 300,
    }),
  }),
});

export const { useGetCoursesListQuery, useGetMyCoursesQuery } = coursesApi;
