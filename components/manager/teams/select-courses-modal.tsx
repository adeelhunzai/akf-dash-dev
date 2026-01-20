"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, X, BookOpen, Loader2 } from "lucide-react";
import { useGetManagerCoursesQuery } from "@/lib/store/api/managerApi";

interface Course {
  id: number;
  name: string;
  progress?: number;
}

interface SelectCoursesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (courses: Course[]) => void;
  existingCourseIds?: number[];
}

export default function SelectCoursesModal({
  open,
  onOpenChange,
  onSelect,
  existingCourseIds = [],
}: SelectCoursesModalProps) {
  const [search, setSearch] = useState("");
  const [selectedCourses, setSelectedCourses] = useState<Course[]>([]);
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [allCourses, setAllCourses] = useState<Course[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
      setAllCourses([]);
      setHasMore(true);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const { data: coursesData, isLoading, isFetching } = useGetManagerCoursesQuery(
    { page, per_page: 20, search: debouncedSearch || undefined },
    { skip: !open }
  );

  // Append new courses when data changes
  useEffect(() => {
    if (coursesData?.data) {
      const newCourses: Course[] = coursesData.data.map((c: any) => ({
        id: c.id,
        name: c.name || c.title,
        progress: 0,
      }));

      if (page === 1) {
        setAllCourses(newCourses);
      } else {
        setAllCourses(prev => {
          const existingIds = new Set(prev.map(c => c.id));
          const uniqueNew = newCourses.filter(c => !existingIds.has(c.id));
          return [...prev, ...uniqueNew];
        });
      }

      // Check if there are more pages
      const totalPages = coursesData.total_pages || Math.ceil((coursesData.total || 0) / 20);
      setHasMore(page < totalPages);
    }
  }, [coursesData, page]);

  // Filter out existing courses
  const filteredCourses = allCourses.filter(
    (c) => !existingCourseIds.includes(c.id)
  );

  // Reset selection when modal opens
  useEffect(() => {
    if (open) {
      setSelectedCourses([]);
      setSearch("");
      setPage(1);
      setAllCourses([]);
      setHasMore(true);
    }
  }, [open]);

  // Infinite scroll handler
  const handleScroll = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container || isFetching || !hasMore) return;

    const { scrollTop, scrollHeight, clientHeight } = container;
    if (scrollTop + clientHeight >= scrollHeight - 100) {
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

  const toggleCourse = (course: Course) => {
    setSelectedCourses((prev) => {
      const exists = prev.find((c) => c.id === course.id);
      if (exists) {
        return prev.filter((c) => c.id !== course.id);
      }
      return [...prev, course];
    });
  };

  const handleAddSelected = () => {
    onSelect(selectedCourses);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] p-0 gap-0" showCloseButton={false}>
        <DialogHeader className="px-6 pt-6 pb-4 flex flex-row items-center justify-between">
          <DialogTitle className="text-xl font-semibold">Select Courses</DialogTitle>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-gray-400 hover:text-gray-600"
            onClick={() => onOpenChange(false)}
          >
            <X className="w-4 h-4" />
          </Button>
        </DialogHeader>

        <div className="px-6 pb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search courses..."
              className="pl-10 h-11 border-gray-200"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div 
          ref={scrollContainerRef}
          className="px-6 pb-4 max-h-[350px] overflow-y-auto"
        >
          {isLoading && page === 1 ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, idx) => (
                <Skeleton key={idx} className="h-14 w-full rounded-lg" />
              ))}
            </div>
          ) : filteredCourses.length > 0 ? (
            <div className="space-y-2">
              {filteredCourses.map((course) => {
                const isSelected = selectedCourses.some((c) => c.id === course.id);
                return (
                  <div
                    key={course.id}
                    className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                      isSelected ? "bg-[#00B140]/10 border border-[#00B140]" : "bg-gray-50 hover:bg-gray-100"
                    }`}
                    onClick={() => toggleCourse(course)}
                  >
                    <Checkbox
                      checked={isSelected}
                      className="data-[state=checked]:bg-[#00B140] data-[state=checked]:border-[#00B140]"
                    />
                    <div className="w-10 h-10 bg-[#00B140] rounded-lg flex items-center justify-center flex-shrink-0">
                      <BookOpen className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-[#1a1a1a] truncate">{course.name}</div>
                    </div>
                  </div>
                );
              })}
              {isFetching && page > 1 && (
                <div className="flex justify-center py-4">
                  <Loader2 className="w-6 h-6 animate-spin text-[#00B140]" />
                </div>
              )}
              {!hasMore && filteredCourses.length > 0 && (
                <div className="text-center py-2 text-sm text-gray-400">
                  No more courses to load
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              {debouncedSearch ? "No courses found matching your search." : "No available courses."}
            </div>
          )}
        </div>

        <div className="flex gap-3 px-6 py-4 border-t">
          <Button
            variant="outline"
            className="flex-1 h-11"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            className="flex-1 h-11 bg-[#00B140] hover:bg-[#00B140]/90 text-white"
            onClick={handleAddSelected}
            disabled={selectedCourses.length === 0}
          >
            Add Selected ({selectedCourses.length})
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
