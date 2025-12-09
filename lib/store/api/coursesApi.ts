import { createApi } from '@reduxjs/toolkit/query/react';
import { createWordpressBaseQuery } from '@/lib/api/wordpressBaseQuery';
import { CoursesListResponse } from '@/lib/types/courses.types';

export const coursesApi = createApi({
  reducerPath: 'coursesApi',
  baseQuery: createWordpressBaseQuery('token'),
  tagTypes: ['CoursesList'],
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
  }),
});

export const { useGetCoursesListQuery } = coursesApi;
