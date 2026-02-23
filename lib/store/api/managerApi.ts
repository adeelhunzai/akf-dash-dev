import { createApi } from '@reduxjs/toolkit/query/react';
import { createWordpressBaseQuery } from '@/lib/api/wordpressBaseQuery';

export const managerApi = createApi({
    reducerPath: 'managerApi',
    baseQuery: createWordpressBaseQuery('token'),
    tagTypes: ['ManagerDashboard', 'ManagerFacilitators', 'ManagerTeams', 'ManagerLearners', 'ManagerReports', 'ManagerCourses'],
    endpoints: (build) => ({
        getManagerDashboard: build.query({
            query: () => '/custom-api/v1/manager-dashboard',
            providesTags: ['ManagerDashboard'],
        }),
        getManagerFacilitators: build.query({
            query: ({ page = 1, per_page = 10, search } = {}) => {
                const params = new URLSearchParams();
                params.append('page', page.toString());
                params.append('per_page', per_page.toString());
                if (search) params.append('search', search);
                return `/custom-api/v1/manager-facilitators?${params.toString()}`;
            },
            providesTags: ['ManagerFacilitators'],
        }),
        getManagerTeams: build.query({
            query: ({ page = 1, per_page = 10, search } = {}) => {
                const params = new URLSearchParams();
                params.append('page', page.toString());
                params.append('per_page', per_page.toString());
                if (search) params.append('search', search);
                return `/custom-api/v1/manager-teams?${params.toString()}`;
            },
            providesTags: ['ManagerTeams'],
        }),
        getManagerLearners: build.query({
            query: ({ page = 1, per_page = 10, search, team_id } = {}) => {
                const params = new URLSearchParams();
                params.append('page', page.toString());
                params.append('per_page', per_page.toString());
                if (search) params.append('search', search);
                if (team_id) params.append('team_id', team_id.toString());
                return `/custom-api/v1/manager-learners?${params.toString()}`;
            },
            providesTags: ['ManagerLearners'],
        }),
        getManagerCourses: build.query({
            query: ({ page = 1, per_page = 10, search, team_id, status = 'all' } = {}) => {
                const params = new URLSearchParams();
                params.append('page', page.toString());
                params.append('per_page', per_page.toString());
                if (search) params.append('search', search);
                if (team_id) params.append('team_id', team_id.toString());
                if (status) params.append('status', status);
                return `/custom-api/v1/manager-courses?${params.toString()}`;
            },
            providesTags: ['ManagerCourses'],
        }),
        getTeamsDropdown: build.query({
            query: () => '/custom-api/v1/manager/teams-dropdown',
            providesTags: ['ManagerTeams'],
        }),
        getManagerCourseDetails: build.query({
            query: (courseId: number) => `/custom-api/v1/manager-courses/${courseId}`,
            providesTags: ['ManagerCourses'],
        }),
        getManagerReportsSummary: build.query({
            query: ({ all_reports } = {}) => {
                const params = new URLSearchParams();
                if (all_reports !== undefined) params.append('all_reports', all_reports.toString());
                return `/custom-api/v1/manager/reports/summary?${params.toString()}`;
            },
            providesTags: ['ManagerReports'],
        }),
        getTopCourses: build.query({
            query: ({ page = 1, per_page = 5, all_reports } = {}) => {
                const params = new URLSearchParams();
                params.append('page', page.toString());
                params.append('per_page', per_page.toString());
                if (all_reports !== undefined) params.append('all_reports', all_reports.toString());
                return `/custom-api/v1/manager/reports/top-courses?${params.toString()}`;
            },
            providesTags: ['ManagerReports'],
        }),
        getTopLearners: build.query({
            query: ({ page = 1, per_page = 5, all_reports } = {}) => {
                const params = new URLSearchParams();
                params.append('page', page.toString());
                params.append('per_page', per_page.toString());
                if (all_reports !== undefined) params.append('all_reports', all_reports.toString());
                return `/custom-api/v1/manager/reports/top-learners?${params.toString()}`;
            },
            providesTags: ['ManagerReports'],
        }),
        getLowPerformingLearners: build.query({
            query: ({ page = 1, per_page = 10, all_reports } = {}) => {
                const params = new URLSearchParams();
                params.append('page', page.toString());
                params.append('per_page', per_page.toString());
                if (all_reports !== undefined) params.append('all_reports', all_reports.toString());
                return `/custom-api/v1/manager/reports/low-performing-learners?${params.toString()}`;
            },
            providesTags: ['ManagerReports'],
        }),
        getLearnerDetails: build.query({
            query: (id) => `/custom-api/v1/manager/reports/learner-details/${id}`,
            providesTags: ['ManagerReports'],
        }),
        createManagerFacilitator: build.mutation<any, any>({
            query: (body) => ({
                url: '/custom-api/v1/manager/facilitators',
                method: 'POST',
                body,
            }),
            invalidatesTags: ['ManagerFacilitators', 'ManagerReports'],
        }),
        getFacilitatorsDropdown: build.query({
            query: () => '/custom-api/v1/manager/facilitators-dropdown',
            providesTags: ['ManagerFacilitators'],
        }),
        deleteManagerTeam: build.mutation<any, number>({
            query: (teamId) => ({
                url: `/custom-api/v1/teams/${teamId}`,
                method: 'DELETE',
            }),
            invalidatesTags: ['ManagerTeams'],
        }),
        generateManagerReport: build.query<{ success: boolean; filename: string; content: string; mime_type: string }, { type: string; date_range: string }>({
            query: ({ type, date_range }) => `/custom-api/v1/manager/reports/generate?type=${type}&date_range=${date_range}`,
        }),
    }),
});

export const {
    useGetManagerDashboardQuery,
    useGetManagerFacilitatorsQuery,
    useGetManagerTeamsQuery,
    useGetManagerLearnersQuery,
    useGetManagerCoursesQuery,
    useGetTeamsDropdownQuery,
    useGetManagerCourseDetailsQuery,
    useGetManagerReportsSummaryQuery,
    useGetTopCoursesQuery,
    useGetTopLearnersQuery,
    useGetLowPerformingLearnersQuery,
    useGetLearnerDetailsQuery,
    useCreateManagerFacilitatorMutation,
    useGetFacilitatorsDropdownQuery,
    useDeleteManagerTeamMutation,
    useLazyGenerateManagerReportQuery,
} = managerApi;


