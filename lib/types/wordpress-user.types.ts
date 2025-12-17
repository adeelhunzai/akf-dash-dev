/**
 * WordPress User API Response Types
 * Based on /wp/v2/users/me?context=edit endpoint
 */

export interface WordPressAvatarUrls {
  '24': string;
  '48': string;
  '96': string;
}

export interface WordPressUserMeta {
  persisted_preferences?: Record<string, unknown>;
  _gamipress_point_points?: number;
}

export interface WordPressUserResponse {
  id: number;
  username: string;
  name: string;
  first_name: string;
  last_name: string;
  email: string;
  url: string;
  description: string;
  link: string;
  locale: string;
  nickname: string;
  slug: string;
  roles: string[];
  registered_date: string;
  capabilities: Record<string, boolean>;
  extra_capabilities: Record<string, boolean>;
  avatar_urls: WordPressAvatarUrls;
  meta: WordPressUserMeta;
  acf: unknown[];
  _links: Record<string, unknown>;
}

/**
 * Maps WordPress roles to application UserRole
 */
export type WordPressRole = 
  | 'administrator'
  | 'subscriber'
  | 'group_leader'
  | 'editor'
  | 'author'
  | 'contributor';

/**
 * Users Count API Response
 * From /custom-api/v1/users-count endpoint
 */
export interface UsersCountResponse {
  total_users: number;
  group_leader: number;
  group_leader_clone: number;
  subscriber: number;
  new_registrations: number;
  active_courses: number;
  active_teams: number;
  // Period-specific fields (optional, only present when period parameter is provided)
  total_users_for_period?: number;
  group_leader_for_period?: number;
  group_leader_clone_for_period?: number;
  subscriber_for_period?: number;
  period?: string;
}

/**
 * Course Completion Rate API Response
 * From /custom-api/v1/course-completion-rate endpoint
 */
export interface CourseCompletionRateResponse {
  total_courses: number;
  total_enrolled: number;
  completed: {
    count: number;
    percentage: number;
  };
  in_progress: {
    count: number;
    percentage: number;
  };
}

/**
 * Top Courses API Response
 * From /custom-api/v1/top-courses endpoint
 */
export interface TopCourse {
  id: number;
  title: string;
  enrollments: number;
  thumbnail: string;
  link: string;
  category: string[];
  modified: string;
}

export interface TopCoursesResponse {
  total_courses_found: number;
  top_courses: TopCourse[];
}

/**
 * Users List API Response
 * From /custom-api/v1/users/list endpoint
 */
export interface UserListItem {
  ID: number;
  user_login: string;
  user_email: string;
  display_name: string;
  roles: string[];
  avatar_url: string;
  teams: string[];
  team_count: number;
  courses_enrolled: number;
}

export interface UsersListResponse {
  current_page: number;
  total_pages: number;
  total_users: number;
  users: UserListItem[];
}

/**
 * User Details API Response
 * From /custom-api/v1/users/{id} endpoint
 */
export interface UserDetailsResponse {
  ID: number;
  user_login: string;
  user_email: string;
  display_name: string;
  roles: string[];
  avatar_url: string;
  organization: string;
  last_login: string | null;
  days_since_login: number | null;
  account_status: 'Active' | 'Inactive';
  days_since_registration: number;
  teams: string[];
  team_count: number;
  total_courses: number;
  completed_courses: number;
  completion_rate: number;
}

/**
 * Update User Request
 * For PUT /custom-api/v1/users/{id} endpoint
 */
export interface UpdateUserRequest {
  userId: number;
  display_name?: string;
  email?: string;
  role?: string;
  organization?: string;
}

/**
 * Update User Response
 * From PUT /custom-api/v1/users/{id} endpoint
 */
export interface UpdateUserResponse {
  success: boolean;
  message: string;
  user?: {
    ID: number;
    display_name: string;
    user_email: string;
    roles: string[];
    organization: string;
  };
}

export interface CreateUserRequest {
  username: string;
  email: string;
  password: string;
  first_name?: string;
  last_name?: string;
  organization?: string;
  role?: string;
  roles?: string[];
}

export type CreateUserResponse = WordPressUserResponse;

/**
 * Delete User Request
 * For DELETE /custom-api/v1/users/{id} endpoint
 */
export interface DeleteUserRequest {
  userId: number;
}

/**
 * Delete User Response
 * From DELETE /custom-api/v1/users/{id} endpoint
 */
export interface DeleteUserResponse {
  success: boolean;
  message: string;
  deleted_user_id: number;
}

/**
 * Learner Dashboard API Response
 * From /custom-api/v1/learner-dashboard endpoint
 */
export interface LearnerDashboardCourse {
  id: number;
  title: string;
  progress: number;
  thumbnail: string;
}

export interface LearnerDashboardAchievement {
  id: number;
  title: string;
  description: string;
  date: string;
  type: string;
}

export interface LearnerDashboardSummary {
  courses_enrolled: number;
  courses_completed: number;
  certificates: number;
  learning_time: string;
}

export interface LearnerDashboardResponse {
  success: boolean;
  data: {
    summary: LearnerDashboardSummary;
    current_progress: LearnerDashboardCourse[];
    achievements: LearnerDashboardAchievement[];
  };
}

/**
 * Filter Users by CSV Response
 * From POST /custom-api/v1/users/filter-by-csv endpoint
 */
export interface CsvFilteredUser {
  ID: number;
  user_login: string;
  user_email: string;
  display_name: string;
  roles: string[];
  avatar_url: string;
  teams: string[];
  team_count: number;
  courses_enrolled: number;
}

export interface CsvNotFoundUser {
  email: string;
  name: string;
}

export interface FilterUsersByCsvResponse {
  success: boolean;
  message: string;
  total_csv_rows: number;
  total_found: number;
  total_not_found: number;
  users: CsvFilteredUser[];
  not_found: CsvNotFoundUser[];
}
