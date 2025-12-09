/**
 * Team Types for LearnDash Groups
 */

export interface Team {
  id: number;
  name: string;
  avatar: string;
  facilitators: number;
  members: number;
  progress: number;
  status: 'Active' | 'Inactive';
  created: string;
}

export interface TeamsListResponse {
  success: boolean;
  teams: Team[];
  pagination: {
    current_page: number;
    per_page: number;
    total_items: number;
    total_pages: number;
  };
}

export interface CreateTeamRequest {
  name: string;
  course_ids: number[];
  description?: string;
  learner_ids: number[];
  facilitator_ids?: number[];
}

export interface CreateTeamResponse {
  success: boolean;
  message: string;
  team_id: number;
  team: Team;
}

export interface UpdateTeamRequest {
  teamId: number;
  name: string;
  course_ids: number[];
  description?: string;
  learner_ids: number[];
  facilitator_ids?: number[];
}

export interface UpdateTeamResponse {
  success: boolean;
  message: string;
  team_id: number;
  team: Team;
}

export interface DeleteTeamRequest {
  teamId: number;
}

export interface DeleteTeamResponse {
  success: boolean;
  message: string;
  deleted_team_id: number;
  deleted_team_name: string;
  removed_members: number;
}

export interface TeamMember {
  id: number;
  name: string;
  email: string;
  avatar: string;
  role: 'Learner' | 'Facilitator' | 'Manager';
  joinDate: string;
  lastActivity: string;
  status: 'Active' | 'Inactive';
}

export interface TeamMembersResponse {
  success: boolean;
  members: TeamMember[];
  total: number;
}

export interface RemoveMemberRequest {
  teamId: number;
  userId: number;
}

export interface RemoveMemberResponse {
  success: boolean;
  message: string;
  removed_user_id: number;
  removed_user_name: string;
}

export interface Facilitator {
  id: number;
  display_name: string;
  avatar_url: string;
}

export interface TeamDetailsResponse {
  success: boolean;
  team: {
    id: number;
    name: string;
    description: string;
    course_ids: number[];
    learner_ids: number[];
    facilitator_ids: number[];
    facilitators: Facilitator[];
  };
}