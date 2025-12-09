import { createApi } from '@reduxjs/toolkit/query/react';
import { createWordpressBaseQuery } from '@/lib/api/wordpressBaseQuery';
import { 
  TeamsListResponse, 
  CreateTeamRequest, 
  CreateTeamResponse,
  UpdateTeamRequest,
  UpdateTeamResponse,
  DeleteTeamRequest, 
  DeleteTeamResponse,
  TeamMembersResponse,
  RemoveMemberRequest,
  RemoveMemberResponse,
  TeamDetailsResponse
} from '@/lib/types/team.types';

export const teamsApi = createApi({
  reducerPath: 'teamsApi',
  baseQuery: createWordpressBaseQuery('token'),
  tagTypes: ['TeamsList'],
  endpoints: (build) => ({
    getTeamsList: build.query<TeamsListResponse, { page: number; per_page?: number; search?: string; status?: string }>({
      query: ({ page, per_page = 10, search, status }) => {
        const params = new URLSearchParams({ 
          page: page.toString(),
          per_page: per_page.toString()
        });
        if (search) params.append('search', search);
        if (status && status !== 'all') params.append('status', status);
        return `/custom-api/v1/teams?${params.toString()}`;
      },
      providesTags: ['TeamsList'],
    }),
    getTeamDetails: build.query<TeamDetailsResponse, number>({
      query: (teamId) => `/custom-api/v1/teams/${teamId}`,
      providesTags: (result, error, teamId) => [{ type: 'TeamsList' as const, id: teamId }],
    }),
    createTeam: build.mutation<CreateTeamResponse, CreateTeamRequest>({
      query: (body) => ({
        url: '/custom-api/v1/teams',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['TeamsList'],
    }),
    updateTeam: build.mutation<UpdateTeamResponse, UpdateTeamRequest>({
      query: ({ teamId, ...body }) => ({
        url: `/custom-api/v1/teams/${teamId}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['TeamsList'],
    }),
    deleteTeam: build.mutation<DeleteTeamResponse, DeleteTeamRequest>({
      query: ({ teamId }) => ({
        url: `/custom-api/v1/teams/${teamId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['TeamsList'],
    }),
    getTeamMembers: build.query<TeamMembersResponse, number>({
      query: (teamId) => `/custom-api/v1/teams/${teamId}/members`,
      providesTags: (result, error, teamId) => [{ type: 'TeamsList' as const, id: teamId }],
    }),
    removeMemberFromTeam: build.mutation<RemoveMemberResponse, RemoveMemberRequest>({
      query: ({ teamId, userId }) => ({
        url: `/custom-api/v1/teams/${teamId}/members/${userId}`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, { teamId }) => [
        { type: 'TeamsList' as const, id: teamId },
        'TeamsList',
      ],
    }),
  }),
});

export const { 
  useGetTeamsListQuery,
  useGetTeamDetailsQuery,
  useCreateTeamMutation,
  useUpdateTeamMutation,
  useDeleteTeamMutation,
  useGetTeamMembersQuery,
  useRemoveMemberFromTeamMutation
} = teamsApi;
