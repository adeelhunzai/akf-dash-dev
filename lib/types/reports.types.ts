export interface CourseReportItem {
  id: string;
  name: string;
  enrolled: number;
  notStarted: number;
  inProgress: number;
  completed: number;
  completionRate: string;
  quizScore: string;
  avgTime: string;
}

export interface CourseReportResponse {
  success: boolean;
  data: CourseReportItem[];
  total: number;
  page: number;
  per_page: number;
  message?: string;
}

export interface LearnerActivity {
  type: 'completed' | 'started' | 'certificate';
  text: string;
  timeAgo: string;
}

export interface LearnerReportItem {
  id: string;
  name: string;
  email: string;
  coursesEnrolled: number;
  coursesCompleted: number;
  coursesInProgress?: number;
  coursesNotStarted?: number;
  totalHours: number;
  totalTimeFormatted?: string;
  averageScore: string;
  teamName?: string;
  lastActive?: string;
  recentActivities?: LearnerActivity[];
}

export interface LearnerReportResponse {
  success: boolean;
  data: LearnerReportItem[];
  total: number;
  page: number;
  per_page: number;
  message?: string;
}

export interface TeamReportItem {
  id: string;
  name: string;
  initials: string;
  members: number;
  avgProgress: number;
  completionRate: number;
}

export interface TeamReportResponse {
  success: boolean;
  data: TeamReportItem[];
  total: number;
  page: number;
  per_page: number;
  message?: string;
}

export interface CoursePopularityMetrics {
  totalCourses: number;
  totalEnrollments: number;
  avgCompletionRate: number;
  avgRating: number;
}

export interface TopCourse {
  id: string;
  rank: number;
  name: string;
  enrolled: number;
  completed: number;
  completionRate: number;
  rating: number;
}

export interface CourseCategory {
  name: string;
  color: string;
  courses: number;
  enrollments: number;
  avgCompletion: number;
}

export interface CoursePopularityResponse {
  success: boolean;
  data: {
    metrics: CoursePopularityMetrics;
    topCourses: TopCourse[];
    categories: CourseCategory[];
  };
  message?: string;
}

export interface CertificateSalesData {
  month: string;
  month_key: string;
  sold: number;
}

export interface CertificateSalesTotals {
  total_cpd_issued: number;
  total_other_issued: number;
  total_certificates_issued: number;
}

export interface CertificateSalesResponse {
  success: boolean;
  data: {
    cpd_certificates: CertificateSalesData[];
    other_certificates: CertificateSalesData[];
    totals: CertificateSalesTotals;
  };
  message?: string;
}

