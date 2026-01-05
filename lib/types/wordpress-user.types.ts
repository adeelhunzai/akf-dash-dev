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
 * Course Detail for User
 */
export interface UserCourseDetail {
  id: number;
  title: string;
  progress: number;
  completed_date?: string | null;
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
  enrolled_courses_details: UserCourseDetail[];
  completed_courses_details: UserCourseDetail[];
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
  resume_url: string;
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

/**
 * Learner Achievements API Response
 * From /custom-api/v1/learner-achievements endpoint
 */
export interface AchievementStat {
  label: string;
  value: string;
}

export interface NextGoal {
  title: string;
  description: string;
  progress: number;
  total: number;
}

export interface LatestGoal {
  id: number;
  title: string;
  description: string;
  icon: string;
  color: string;
  status: string;
}

export interface WizardBadge {
  id: number;
  title: string;
  description: string;
  icon: string;
  color: string;
  progress: number;
  required: number;
  unlocked: boolean;
}

export interface Achievement {
  id: number;
  title: string;
  description: string;
  date: string;
  icon: string;
  color: string;
  category: string;
  categoryColor: string;
}

export interface LearnerAchievementsResponse {
  success: boolean;
  data: {
    stats: AchievementStat[];
    next_goal: NextGoal;
    latest_goals: LatestGoal[];
    wizard_badges: WizardBadge[];
    achievements: Achievement[];
  };
}

/**
 * Learner Certificates API Response
 * From /custom-api/v1/learner-certificates endpoint
 */
export interface Certificate {
  id: string;
  certificate_id: number;
  course_id: number;
  title: string;
  certificate_code: string;
  instructor: string;
  score: string;
  issue_date: string;
  color: string;
  view_url: string;
  download_url: string;
}

export interface LearnerCertificatesResponse {
  success: boolean;
  data: {
    certificates: Certificate[];
    total: number;
  };
}

export interface CertificateDetailsResponse {
  success: boolean;
  data: Certificate;
}

export interface CertificateDownloadResponse {
  success: boolean;
  data: {
    download_url: string;
    filename: string;
  };
}

export interface CertificateViewResponse {
  success: boolean;
  data: {
    certificate_url: string;
    title: string;
  };
}

/**
 * Learner Settings API Types
 * From /custom-api/v1/learner-settings endpoint
 */
export interface PersonalInfo {
  full_name: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  department: string;
  avatar_url: string;
}

export interface LearningPreferences {
  preferred_language: string;
  learning_goal: string;
}

export interface NotificationSettings {
  course_reminders: boolean;
  achievement_notifications: boolean;
  weekly_report: boolean;
}

export interface SelectOption {
  value: string;
  label: string;
}

export interface AvailableOptions {
  departments: SelectOption[];
  languages: SelectOption[];
  learning_goals: SelectOption[];
}

export interface LearnerSettingsResponse {
  success: boolean;
  data: {
    personal_info: PersonalInfo;
    learning_preferences: LearningPreferences;
    notifications: NotificationSettings;
    available_options: AvailableOptions;
  };
}

export interface UpdateLearnerSettingsRequest {
  personal_info?: Partial<Omit<PersonalInfo, 'avatar_url'>>;
  learning_preferences?: Partial<LearningPreferences>;
  notifications?: Partial<NotificationSettings>;
}

export interface UpdateLearnerSettingsResponse {
  success: boolean;
  message: string;
  updated_fields: string[];
  data: {
    personal_info: PersonalInfo;
    learning_preferences: LearningPreferences;
    notifications: NotificationSettings;
  };
}

/**
 * Facilitator Dashboard API Response
 * From /custom-api/v1/facilitator-dashboard endpoint
 */
export interface FacilitatorDashboardSummary {
  courses_assigned: number;
  learners_enrolled: number;
  certificates_issued: number;
  completion_rate: string;
}

export interface FacilitatorCourseCompletion {
  completed: number;
  in_progress: number;
  completed_percentage: number;
  in_progress_percentage: number;
}

export interface FacilitatorUserDistributionCountry {
  country: string;
  users: number;
}

export interface FacilitatorUserDistribution {
  total_users: number;
  total_countries: number;
  active_regions: number;
  growth_rate: string;
  countries: FacilitatorUserDistributionCountry[];
}

export interface FacilitatorDashboardResponse {
  success: boolean;
  data: {
    summary: FacilitatorDashboardSummary;
    course_completion: FacilitatorCourseCompletion;
    user_distribution: FacilitatorUserDistribution;
  };
}

/**
 * Facilitator Courses API Response
 * From /custom-api/v1/facilitator-courses endpoint
 */
export interface FacilitatorCourse {
  id: number;
  title: string;
  start_date: string;
  groups: string[];
  total_learners: number;
  active_learners: number;
  completion_rate: number;
  status: 'active' | 'completed' | 'upcoming';
}

export interface FacilitatorCoursesPagination {
  current_page: number;
  total_pages: number;
  total_courses: number;
  per_page: number;
}

export interface FacilitatorGroup {
  id: number;
  name: string;
}

export interface FacilitatorCoursesListResponse {
  success: boolean;
  data: {
    courses: FacilitatorCourse[];
    pagination: FacilitatorCoursesPagination;
    filters: {
      available_groups: FacilitatorGroup[];
    };
  };
}

/**
 * Facilitator Course Details API Response
 * From /custom-api/v1/facilitator-courses/{id} endpoint
 */
export interface FacilitatorCourseDetails {
  id: number;
  title: string;
  description: string;
  start_date: string;
  end_date: string | null;
  duration: string;
  groups: string[];
  completion_rate: number;
  total_learners: number;
  active_learners: number;
  certificates_issued: number;
}

export interface FacilitatorCourseLearner {
  id: number;
  name: string;
  email: string;
  avatar_url: string;
  enrolled_date: string;
  last_active: string;
  progress: number;
  status: 'in_progress' | 'completed';
}

export interface FacilitatorCourseDetailsResponse {
  success: boolean;
  data: {
    course: FacilitatorCourseDetails;
    learners: FacilitatorCourseLearner[];
  };
}



// Team Member Management Types
export interface AddLearnersToTeamRequest {
  user_ids: number[];
}

export interface AddLearnersToTeamResponse {
  success: boolean;
  message: string;
  data?: {
    added_count: number;
    errors: string[];
  };
}

export interface RemoveLearnerFromTeamRequest {
  user_id: number;
}


export interface RemoveLearnerFromTeamResponse {
  success: boolean;
  message: string;
}

// Facilitator Certificates Types
export interface FacilitatorCertificate {
  id: number;
  display_id: string;
  learner: {
    id: number;
    name: string;
    email: string;
    avatar_url: string;
  };
  course: string;
  final_grade: string;
  completion_date: string;
  certificate_url: string | null;
  status: 'issued' | 'not_issued';
}

export interface FacilitatorCertificatesResponse {
  success: boolean;
  data: {
    stats: {
      total_issued: number;
    };
    certificates: FacilitatorCertificate[];
    pagination: {
      current_page: number;
      total_pages: number;
      total_items: number;
      per_page: number;
    };
  };
}

// Facilitator Reports Types
export interface FacilitatorReportsSummary {
  total_learners: number;
  total_teams: number;
  certificates_issued: number;
}

export interface FacilitatorReportsSummaryResponse {
  success: boolean;
  data: FacilitatorReportsSummary;
}

export interface FacilitatorCourseReport {
  course_id: number;
  course_name: string;
  team: string;
  team_id: number;
  enrolled: number;
  completed: number;
  in_progress: number;
  not_started: number;
  avg_score: number;
  certificates: number;
}

export interface FacilitatorCourseReportsResponse {
  success: boolean;
  data: {
    courses: FacilitatorCourseReport[];
    pagination?: {
      total_items: number;
      total_pages: number;
      current_page: number;
      per_page: number;
    };
  };
}

export interface FacilitatorLearnerReport {
  id: number;
  name: string;
  email: string;
  courses_enrolled: number;
  courses_completed: number;
  courses_in_progress: number;
  courses_not_started: number;
}

export interface FacilitatorLearnerReportsResponse {
  success: boolean;
  data: {
    learners: FacilitatorLearnerReport[];
    pagination?: {
      total_items: number;
      total_pages: number;
      current_page: number;
      per_page: number;
    };
  };
}

export interface FacilitatorTeamReport {
  team_id: number;
  team_name: string;
  learners: number;
  courses_assigned: number;
  completed: number;
  avg_score: number;
  certificates: number;
}

export interface FacilitatorTeamReportsResponse {
  success: boolean;
  data: {
    teams: FacilitatorTeamReport[];
    pagination?: {
      total_items: number;
      total_pages: number;
      current_page: number;
      per_page: number;
    };
  };
}

export interface FacilitatorReportsExportResponse {
  success: boolean;
  data: {
    csv: string;
    filename: string;
  };
}
