import { createApi } from '@reduxjs/toolkit/query/react';
import { createWordpressBaseQuery } from '@/lib/api/wordpressBaseQuery';
import { CourseReportResponse, LearnerReportResponse, TeamReportResponse, CoursePopularityResponse, CertificateSalesResponse } from '@/lib/types/reports.types';

export const reportsApi = createApi({
  reducerPath: 'reportsApi',
  baseQuery: createWordpressBaseQuery('token'),
  tagTypes: ['CourseReport', 'LearnerReport', 'TeamReport', 'CoursePopularity', 'CertificateSales'],
  endpoints: (build) => ({
    getCourseReport: build.query<CourseReportResponse, { page?: number; per_page?: number; search?: string; days?: number; start_date?: string; end_date?: string }>({
      query: ({ page = 1, per_page = 10, search, days, start_date, end_date }) => {
        const params = new URLSearchParams({
          page: page.toString(),
          per_page: per_page.toString()
        });
        if (search) params.append('search', search);
        if (days) params.append('days', days.toString());
        if (start_date) params.append('start_date', start_date);
        if (end_date) params.append('end_date', end_date);
        return `/custom-api/v1/course-report?${params.toString()}`;
      },
      providesTags: ['CourseReport'],
    }),
    getLearnerReport: build.query<LearnerReportResponse, { page?: number; per_page?: number; search?: string; days?: number; start_date?: string; end_date?: string }>({
      query: ({ page = 1, per_page = 10, search, days, start_date, end_date }) => {
        const params = new URLSearchParams({
          page: page.toString(),
          per_page: per_page.toString()
        });
        if (search) params.append('search', search);
        if (days) params.append('days', days.toString());
        if (start_date) params.append('start_date', start_date);
        if (end_date) params.append('end_date', end_date);
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
    getCertificateSales: build.query<CertificateSalesResponse, { months_back?: number; year?: number; start_date?: string; end_date?: string }>({
      query: ({ months_back = 24, year, start_date, end_date }) => {
        const params = new URLSearchParams();
        if (months_back) params.append('months_back', months_back.toString());
        if (year) params.append('year', year.toString());
        if (start_date) params.append('start_date', start_date);
        if (end_date) params.append('end_date', end_date);
        return `/custom-api/v1/certificate-sales?${params.toString()}`;
      },
      providesTags: ['CertificateSales'],
    }),
  }),
});

export const {
  useGetCourseReportQuery,
  useGetLearnerReportQuery,
  useGetTeamReportQuery,
  useGetCoursePopularityQuery,
  useGetCertificateSalesQuery
} = reportsApi;

