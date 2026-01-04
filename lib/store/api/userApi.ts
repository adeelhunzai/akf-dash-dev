import { createApi } from '@reduxjs/toolkit/query/react';
import { createWordpressBaseQuery } from '@/lib/api/wordpressBaseQuery';
import { WordPressUserResponse, UsersCountResponse, CourseCompletionRateResponse, TopCoursesResponse, UsersListResponse, UserDetailsResponse, CreateUserRequest, CreateUserResponse, UpdateUserRequest, UpdateUserResponse, DeleteUserRequest, DeleteUserResponse, LearnerDashboardResponse, FilterUsersByCsvResponse, LearnerAchievementsResponse, LearnerCertificatesResponse, CertificateDownloadResponse, CertificateViewResponse, LearnerSettingsResponse, UpdateLearnerSettingsRequest, UpdateLearnerSettingsResponse, FacilitatorDashboardResponse, FacilitatorCoursesListResponse, FacilitatorCourseDetailsResponse, FacilitatorTeamsListResponse, FacilitatorTeamDetailsResponse, FacilitatorLearnersListResponse, FacilitatorLearnerDetailsResponse, AddLearnersToTeamRequest, AddLearnersToTeamResponse, RemoveLearnerFromTeamRequest, RemoveLearnerFromTeamResponse, FacilitatorReportsSummaryResponse, FacilitatorCourseReportsResponse, FacilitatorLearnerReportsResponse, FacilitatorTeamReportsResponse, FacilitatorReportsExportResponse } from '@/lib/types/wordpress-user.types';

export interface MetricsQueryArgs {
  period?: string;
  from?: string;
  to?: string;
}

export const usersApi = createApi({
  reducerPath: 'usersApi',
  baseQuery: createWordpressBaseQuery('token'),
  tagTypes: ['CurrentUser', 'UsersCount', 'CourseCompletionRate', 'TopCourses', 'UsersList', 'UserDetails', 'LearnerDashboard', 'LearnerAchievements', 'LearnerCertificates', 'LearnerSettings', 'FacilitatorDashboard', 'FacilitatorCourses', 'FacilitatorCourseDetails', 'FacilitatorTeams', 'FacilitatorLearners', 'FacilitatorCertificates', 'FacilitatorReports'],
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
    getFacilitatorDashboard: build.query<FacilitatorDashboardResponse, string | MetricsQueryArgs | undefined>({
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
        return `/custom-api/v1/facilitator-dashboard${queryString ? `?${queryString}` : ''}`;
      },
      providesTags: ['FacilitatorDashboard'],
      keepUnusedDataFor: 300,
    }),
    getFacilitatorCourses: build.query<FacilitatorCoursesListResponse, { search?: string; team?: number; status?: string; page?: number; per_page?: number } | void>({
      query: ({ search, team, status, page = 1, per_page = 20 } = {}) => {
        const params = new URLSearchParams();
        if (search) params.append('search', search);
        if (team) params.append('team', team.toString());
        if (status && status !== 'all') params.append('status', status);
        params.append('page', page.toString());
        params.append('per_page', per_page.toString());
        const queryString = params.toString();
        return `/custom-api/v1/facilitator-courses${queryString ? `?${queryString}` : ''}`;
      },
      providesTags: ['FacilitatorCourses'],
      keepUnusedDataFor: 300,
    }),
    getFacilitatorCourseDetails: build.query<FacilitatorCourseDetailsResponse, number>({
      query: (courseId) => `/custom-api/v1/facilitator-courses/${courseId}`,
      providesTags: (result, error, courseId) => [{ type: 'FacilitatorCourseDetails', id: courseId }],
      keepUnusedDataFor: 300,
    }),
    getFacilitatorTeams: build.query<FacilitatorTeamsListResponse, void>({
      query: () => '/custom-api/v1/facilitator-teams',
      providesTags: ['FacilitatorTeams'],
      keepUnusedDataFor: 300,
    }),
    getFacilitatorTeamDetails: build.query<FacilitatorTeamDetailsResponse, number>({
      query: (teamId) => `/custom-api/v1/facilitator-teams/${teamId}`,
      providesTags: (result, error, teamId) => [{ type: 'FacilitatorTeams', id: teamId }],
      keepUnusedDataFor: 300,
    }),
    getFacilitatorLearners: build.query<FacilitatorLearnersListResponse, { search?: string; team?: number } | void>({
      query: ({ search, team } = {}) => {
        const params = new URLSearchParams();
        if (search) params.append('search', search);
        if (team) params.append('team', team.toString());
        const queryString = params.toString();
        return `/custom-api/v1/facilitator-learners${queryString ? `?${queryString}` : ''}`;
      },
      providesTags: ['FacilitatorLearners'],
      keepUnusedDataFor: 300,
    }),
    getFacilitatorLearnerDetails: build.query<FacilitatorLearnerDetailsResponse, number>({
      query: (learnerId) => `/custom-api/v1/facilitator-learners/${learnerId}`,
      providesTags: (result, error, learnerId) => [{ type: 'FacilitatorLearners', id: learnerId }],
      keepUnusedDataFor: 300,
    }),
    addLearnersToTeam: build.mutation<AddLearnersToTeamResponse, { teamId: number; request: AddLearnersToTeamRequest }>({
      query: ({ teamId, request }) => ({
        url: `/custom-api/v1/facilitator-teams/${teamId}/add-learners`,
        method: 'POST',
        body: request,
      }),
      invalidatesTags: ['FacilitatorTeams', 'FacilitatorLearners'],
    }),
    removeLearnerFromTeam: build.mutation<RemoveLearnerFromTeamResponse, { teamId: number; userId: number }>({
      query: ({ teamId, userId }) => ({
        url: `/custom-api/v1/facilitator-teams/${teamId}/remove-learner`,
        method: 'DELETE',
        body: { user_id: userId },
      }),
      invalidatesTags: ['FacilitatorTeams', 'FacilitatorLearners'],
    }),
    getFacilitatorCertificates: build.query<FacilitatorCertificatesResponse, { page?: number; per_page?: number; search?: string; team_id?: number; course_id?: number } | void>({
      query: ({ page = 1, per_page = 10, search, team_id, course_id } = {}) => {
        const params = new URLSearchParams();
        params.append('page', page.toString());
        params.append('per_page', per_page.toString());
        if (search) params.append('search', search);
        if (team_id) params.append('team_id', team_id.toString());
        if (course_id) params.append('course_id', course_id.toString());
        const queryString = params.toString();
        return `/custom-api/v1/facilitator-certificates${queryString ? `?${queryString}` : ''}`;
      },
      providesTags: ['FacilitatorCertificates'],
      keepUnusedDataFor: 300,
    }),
    // Facilitator Reports endpoints
    getFacilitatorReportsSummary: build.query<FacilitatorReportsSummaryResponse, void>({
      query: () => '/custom-api/v1/facilitator-reports/summary',
      providesTags: ['FacilitatorReports'],
      keepUnusedDataFor: 300,
    }),
    getFacilitatorCourseReports: build.query<FacilitatorCourseReportsResponse, void>({
      query: () => '/custom-api/v1/facilitator-reports/courses',
      providesTags: ['FacilitatorReports'],
      keepUnusedDataFor: 300,
    }),
    getFacilitatorLearnerReports: build.query<FacilitatorLearnerReportsResponse, void>({
      query: () => '/custom-api/v1/facilitator-reports/learners',
      providesTags: ['FacilitatorReports'],
      keepUnusedDataFor: 300,
    }),
    getFacilitatorTeamReports: build.query<FacilitatorTeamReportsResponse, void>({
      query: () => '/custom-api/v1/facilitator-reports/teams',
      providesTags: ['FacilitatorReports'],
      keepUnusedDataFor: 300,
    }),
    exportFacilitatorCourseReports: build.query<FacilitatorReportsExportResponse, void>({
      query: () => '/custom-api/v1/facilitator-reports/export/courses',
    }),
    exportFacilitatorLearnerReports: build.query<FacilitatorReportsExportResponse, void>({
      query: () => '/custom-api/v1/facilitator-reports/export/learners',
    }),
    exportFacilitatorTeamReports: build.query<FacilitatorReportsExportResponse, void>({
      query: () => '/custom-api/v1/facilitator-reports/export/teams',
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
  useFilterUsersByCsvMutation,
  useGetFacilitatorDashboardQuery,
  useGetFacilitatorCoursesQuery,
  useGetFacilitatorCourseDetailsQuery,
  useGetFacilitatorTeamsQuery,
  useGetFacilitatorTeamDetailsQuery,
  useGetFacilitatorLearnersQuery,
  useGetFacilitatorLearnerDetailsQuery,
  useAddLearnersToTeamMutation,
  useRemoveLearnerFromTeamMutation,
  useGetFacilitatorCertificatesQuery,
  useGetFacilitatorReportsSummaryQuery,
  useGetFacilitatorCourseReportsQuery,
  useGetFacilitatorLearnerReportsQuery,
  useGetFacilitatorTeamReportsQuery,
  useLazyExportFacilitatorCourseReportsQuery,
  useLazyExportFacilitatorLearnerReportsQuery,
  useLazyExportFacilitatorTeamReportsQuery
} = usersApi;