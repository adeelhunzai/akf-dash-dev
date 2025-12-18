export interface Course {
  id: number;
  title: string;
  slug: string;
  status: string;
  enrolled_count?: number;
  completion_rate?: number;
}

export interface CoursesListResponse {
  courses: Course[];
  total: number;
  total_pages: number;
  current_page: number;
}

// My Courses types (for learner's enrolled courses)
export interface MyCourse {
  id: number;
  title: string;
  instructor: string;
  progress: number;
  totalLessons: number;
  completedLessons: number;
  status: 'completed' | 'in-progress';
  color: string;
  thumbnail: string;
  link: string;
}

export interface MyCoursesResponse {
  success: boolean;
  data: MyCourse[];
  pagination: {
    current_page: number;
    per_page: number;
    total_items: number;
    total_pages: number;
  };
}