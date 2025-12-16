"use client"

import { useGetTopCoursesQuery } from "@/lib/store/api/userApi";
import { Skeleton } from "@/components/ui/skeleton";

interface CourseBarProps {
  name: string;
  enrollments: number;
  maxEnrollments: number;
  color: string;
}

function CourseBar({ name, enrollments, maxEnrollments, color }: CourseBarProps) {
  const percentage = (enrollments / maxEnrollments) * 100;
  
  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium text-foreground min-w-[140px] truncate">
          {name}
        </span>
        <div className="relative w-full bg-gray-200 rounded-full h-7 overflow-visible">
          <div 
            className="h-full rounded-full flex items-center justify-end pr-3 transition-all duration-1000 ease-out"
            style={{ 
              width: `${percentage}%`,
              backgroundColor: color,
              minWidth: '80px'
            }}
          >
            <span className="text-white text-xs font-semibold whitespace-nowrap">
              {enrollments.toLocaleString()}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

interface TopCoursesChartProps {
  period?: string;
}

export default function TopCoursesChart({ period }: TopCoursesChartProps) {
  const { data, isLoading, isError } = useGetTopCoursesQuery(period);

  // Color palette for the bars
  const colors = ["#1275DB", "#00B140", "#FDC300", "#CD1D5A", "#C4A2EA"];

  if (isLoading) {
    return (
      <div className="space-y-3 md:space-y-4 w-full">
        {Array.from({ length: 5 }).map((_, index) => (
          <div key={index} className="space-y-1.5">
            <div className="flex items-center gap-3">
              <Skeleton className="h-4 w-[140px]" />
              <Skeleton className="h-7 w-full rounded-full" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="flex items-center justify-center h-40">
        <p className="text-destructive">Failed to load top courses</p>
      </div>
    );
  }

  const courses = data.top_courses.map((course, index) => ({
    name: course.title.length > 25 ? course.title.substring(0, 25) + "..." : course.title,
    enrollments: course.enrollments,
    color: colors[index % colors.length],
  }));

  const maxEnrollments = Math.max(...courses.map(c => c.enrollments));

  return (
    <div className="space-y-3 md:space-y-4 w-full">
      {courses.map((course, index) => (
        <CourseBar
          key={index}
          name={course.name}
          enrollments={course.enrollments}
          maxEnrollments={maxEnrollments}
          color={course.color}
        />
      ))}
    </div>
  );
}
