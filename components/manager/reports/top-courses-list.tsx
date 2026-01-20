"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Star, Loader2 } from "lucide-react";
import { useGetTopCoursesQuery } from "@/lib/store/api/managerApi";
import { Skeleton } from "@/components/ui/skeleton";
import { useState, useEffect, useRef, useCallback } from "react";

export default function TopPerformingCourses() {
  const [page, setPage] = useState(1);
  const [allCourses, setAllCourses] = useState<any[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const { data: coursesData, isLoading, isFetching } = useGetTopCoursesQuery({ page, per_page: 10 });

  // Append new courses when data changes
  useEffect(() => {
    if (coursesData?.data) {
      if (page === 1) {
        setAllCourses(coursesData.data);
      } else {
        setAllCourses(prev => {
          const existingIds = new Set(prev.map(c => c.id));
          const newCourses = coursesData.data.filter((c: any) => !existingIds.has(c.id));
          return [...prev, ...newCourses];
        });
      }
      setHasMore(page < (coursesData.total_pages || 1));
    }
  }, [coursesData, page]);

  // Handle scroll for infinite loading
  const handleScroll = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container || isFetching || !hasMore) return;

    const { scrollTop, scrollHeight, clientHeight } = container;
    // Load more when within 50px of the bottom
    if (scrollHeight - scrollTop - clientHeight < 50) {
      setPage(prev => prev + 1);
    }
  }, [isFetching, hasMore]);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, [handleScroll]);

  const colors = ["bg-[#10B981]", "bg-[#10B981]", "bg-[#10B981]", "bg-[#10B981]", "bg-[#10B981]"]; // Green for top ranks per design

  return (
    <Card className="border border-gray-100 shadow-sm rounded-xl h-full flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between p-6 pb-4">
        <div>
          <CardTitle className="text-lg font-bold text-[#1a1a1a]">
            Top Performing Courses
          </CardTitle>
          <p className="text-sm text-muted-foreground font-normal mt-1">
            Highest enrollment and completion rates
          </p>
        </div>
      </CardHeader>
      <CardContent className="px-6 pb-6 pt-0 flex-1 overflow-hidden">
        {isLoading && page === 1 ? (
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-20 w-full rounded-xl" />
            ))}
          </div>
        ) : (
          <div 
            ref={scrollContainerRef}
            className="space-y-4 max-h-[420px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent"
          >
            {allCourses.map((course: any, index: number) => (
              <div
                key={course.id}
                className="flex items-center gap-4 bg-[#F8F9FB] rounded-xl p-4 transition-colors hover:bg-gray-50"
              >
                <div
                  className={`w-10 h-10 rounded-lg ${
                    colors[index % colors.length] || "bg-[#10B981]"
                  } flex items-center justify-center text-white font-bold text-sm shrink-0`}
                >
                  #{index + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-sm text-[#1a1a1a] truncate">
                    {course.title}
                  </h4>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                    <span className="truncate">{course.department}</span>
                    <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                    <span>{course.enrolled_count} enrolled</span>
                    <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                    <span>{course.completed_count} completed</span>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="flex items-center justify-end gap-1 text-sm font-semibold text-[#1a1a1a]">
                    <Star className={`w-3 h-3 ${course.rating > 0 ? "fill-current text-[#FDC300] fill-[#FDC300]" : "text-gray-300"}`} />
                    {course.rating > 0 ? course.rating : "N/A"}
                  </div>
                  <p className="text-xs font-medium text-[#10B981] mt-1">
                    {course.completion_percentage}% completion
                  </p>
                </div>
              </div>
            ))}
            {isFetching && page > 1 && (
              <div className="flex justify-center py-4">
                <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
              </div>
            )}
            {!hasMore && allCourses.length > 5 && (
              <p className="text-center text-xs text-muted-foreground py-2">
                All courses loaded
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
