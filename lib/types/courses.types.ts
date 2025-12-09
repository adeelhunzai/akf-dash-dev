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
