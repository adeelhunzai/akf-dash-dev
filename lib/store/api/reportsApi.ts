import { createApi } from '@reduxjs/toolkit/query/react';
import { createWordpressBaseQuery } from '@/lib/api/wordpressBaseQuery';
import { CourseReportResponse, LearnerReportResponse, TeamReportResponse, CoursePopularityResponse } from '@/lib/types/reports.types';

export const reportsApi = createApi({
  reducerPath: 'reportsApi',
  baseQuery: createWordpressBaseQuery('token'),
  tagTypes: ['CourseReport', 'LearnerReport', 'TeamReport', 'CoursePopularity'],
  endpoints: (build) => ({
    getCourseReport: build.query<CourseReportResponse, { page?: number; per_page?: number; search?: string; days?: number }>({
      query: ({ page = 1, per_page = 10, search, days }) => {
        const params = new URLSearchParams({ 
          page: page.toString(),
          per_page: per_page.toString()
        });
        if (search) params.append('search', search);
        if (days) params.append('days', days.toString());
        return `/custom-api/v1/course-report?${params.toString()}`;
      },
      providesTags: ['CourseReport'],
    }),
    getLearnerReport: build.query<LearnerReportResponse, { page?: number; per_page?: number; search?: string; days?: number }>({
      query: ({ page = 1, per_page = 10, search, days }) => {
        const params = new URLSearchParams({ 
          page: page.toString(),
          per_page: per_page.toString()
        });
        if (search) params.append('search', search);
        if (days) params.append('days', days.toString());
        return `/custom-api/v1/learner-report?${params.toString()}`;
      },
      providesTags: ['LearnerReport'],
    }),
    getTeamReport: build.query<TeamReportResponse, { page?: number; per_page?: number; search?: string }>({
      query: ({ page = 1, per_page = 20, search }) => {
        const params = new URLSearchParams({ 
          page: page.toString(),
          per_page: per_page.toString()
        });
        if (search) params.append('search', search);
        return `/custom-api/v1/team-report?${params.toString()}`;
      },
      providesTags: ['TeamReport'],
    }),
    getCoursePopularity: build.query<CoursePopularityResponse, void>({
      query: () => '/custom-api/v1/course-popularity',
      providesTags: ['CoursePopularity'],
    }),
  }),
});

export const { useGetCourseReportQuery, useGetLearnerReportQuery, useGetTeamReportQuery, useGetCoursePopularityQuery } = reportsApi;

