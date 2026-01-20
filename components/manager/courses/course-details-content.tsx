"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useGetManagerCourseDetailsQuery } from "@/lib/store/api/managerApi";

interface CourseDetailsContentProps {
  courseId: number;
}

interface Learner {
  id: number;
  name: string;
  email: string;
  initials: string;
  enrolled_date: string;
  last_active: string;
}

interface CourseDetails {
  id: number;
  name: string;
  description: string;
  team: string | null;
  teams: { id: number; name: string }[];
  start_date: string;
  end_date: string;
  duration: string;
  stats: {
    total_learners: number;
    active_learners: number;
    certificates_issued: number;
  };
  learners: Learner[];
}

export default function CourseDetailsContent({ courseId }: CourseDetailsContentProps) {
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  
  const { data, isLoading } = useGetManagerCourseDetailsQuery(courseId);
  
  const course: CourseDetails | undefined = data?.data;

  // Pagination logic for learners
  const allLearners = course?.learners || [];
  const totalLearners = allLearners.length;
  const totalPages = Math.ceil(totalLearners / perPage);
  const startIndex = (page - 1) * perPage;
  const paginatedLearners = allLearners.slice(startIndex, startIndex + perPage);

  // Format date for display
  const formatDate = (dateString: string) => {
    if (!dateString) return "—";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  };

  // Helper function to generate page numbers with ellipsis
  const getPageNumbers = () => {
    const current = page;
    const pages: (number | string)[] = [];

    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      let start = Math.max(2, current - 1);
      let end = Math.min(totalPages - 1, current + 1);

      if (current <= 3) { start = 2; end = 5; }
      if (current >= totalPages - 2) { start = totalPages - 4; end = totalPages - 1; }

      if (start > 2) pages.push('...');
      for (let i = start; i <= end; i++) pages.push(i);
      if (end < totalPages - 1) pages.push('...');
      pages.push(totalPages);
    }
    return pages;
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <Card className="border border-gray-100 shadow-sm bg-white">
          <CardContent className="p-6 space-y-6">
            <Skeleton className="h-8 w-96" />
            <Skeleton className="h-4 w-64" />
            <Skeleton className="h-16 w-full" />
            <div className="grid grid-cols-3 gap-4">
              <Skeleton className="h-24" />
              <Skeleton className="h-24" />
              <Skeleton className="h-24" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-[#1a1a1a]">Courses Details</h1>
        <Card className="border border-gray-100 shadow-sm bg-white">
          <CardContent className="p-6">
            <p className="text-gray-500 text-center py-8">Course not found.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-[#1a1a1a]">Courses Details</h1>

      <Card className="border border-gray-100 shadow-sm bg-white">
        <CardContent className="p-6">
          {/* Course Header */}
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-[#1a1a1a] mb-2">{course.name}</h2>
            <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
              {course.team && (
                <>
                  <span className="text-gray-600">{course.team}</span>
                  <span className="text-gray-300">|</span>
                </>
              )}
              {course.start_date && (
                <>
                  <span>
                    {formatDate(course.start_date)}
                    {course.end_date && ` - ${formatDate(course.end_date)}`}
                  </span>
                  {course.duration && (
                    <>
                      <span className="text-gray-300">|</span>
                      <span>{course.duration}</span>
                    </>
                  )}
                </>
              )}
            </div>
            {course.description && (
              <p className="text-gray-600 text-sm leading-relaxed">{course.description}</p>
            )}
          </div>

          {/* Overview Tab */}
          <div className="border-b border-gray-100 mb-6">
            <button className="pb-3 px-1 text-[#00B140] font-medium border-b-2 border-[#00B140]">
              Overview
            </button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-gray-50 rounded-lg p-4 border-l-4 border-[#00B140]">
              <div className="text-3xl font-bold text-[#1a1a1a]">{course.stats.total_learners}</div>
              <div className="text-sm text-gray-500">Total Learners</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-4 border-l-4 border-[#00B140]">
              <div className="text-3xl font-bold text-[#1a1a1a]">{course.stats.active_learners}</div>
              <div className="text-sm text-gray-500">Active Learners</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-4 border-l-4 border-[#00B140]">
              <div className="text-3xl font-bold text-[#1a1a1a]">{course.stats.certificates_issued}</div>
              <div className="text-sm text-gray-500">Certificates Issued</div>
            </div>
          </div>

          {/* Learners Section */}
          <div>
            <h3 className="text-xl font-bold text-[#1a1a1a] mb-4">Learners</h3>
            
            <div className="rounded-md border border-gray-100 overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-[#F9FAFB] hover:bg-[#F9FAFB]">
                    <TableHead className="font-semibold text-gray-500 h-12 pl-6">Learner</TableHead>
                    <TableHead className="font-semibold text-gray-500 h-12">Enrolled</TableHead>
                    <TableHead className="font-semibold text-gray-500 h-12">Last Active</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedLearners.length > 0 ? (
                    paginatedLearners.map((learner) => (
                      <TableRow key={learner.id} className="hover:bg-gray-50/50">
                        <TableCell className="py-4 pl-6">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10 bg-[#00B140]">
                              <AvatarFallback className="text-white bg-[#00B140] font-semibold text-sm">
                                {learner.initials}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium text-[#1a1a1a]">{learner.name}</div>
                              <div className="text-xs text-gray-500">{learner.email}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="py-4 text-gray-600">
                          {formatDate(learner.enrolled_date)}
                        </TableCell>
                        <TableCell className="py-4 text-gray-600">
                          {formatDate(learner.last_active)}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={3} className="h-24 text-center text-gray-500">
                        No learners enrolled in this course.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            {totalPages > 0 && totalLearners > 0 && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100">
                <div className="flex items-center gap-4">
                  <div className="text-sm text-gray-500">
                    Showing {startIndex + 1} to{" "}
                    {Math.min(startIndex + perPage, totalLearners)} of{" "}
                    {totalLearners} learners
                  </div>
                  
                  {/* Per Page Selector */}
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500">Show:</span>
                    <Select value={perPage.toString()} onValueChange={(v) => { setPerPage(Number(v)); setPage(1); }}>
                      <SelectTrigger className="h-8 w-[70px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="10">10</SelectItem>
                        <SelectItem value="20">20</SelectItem>
                        <SelectItem value="50">50</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(prev => Math.max(1, prev - 1))}
                    disabled={page === 1}
                    className="h-8"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Previous
                  </Button>

                  {/* Page Numbers with Ellipsis */}
                  <div className="flex items-center gap-1">
                    {getPageNumbers().map((pageNum, index) => {
                      if (pageNum === '...') {
                        return (
                          <span key={`ellipsis-${index}`} className="px-2 text-gray-500">
                            ...
                          </span>
                        )
                      }
                      return (
                        <Button
                          key={pageNum}
                          variant="outline"
                          size="sm"
                          onClick={() => setPage(pageNum as number)}
                          className={`h-8 min-w-8 px-2 ${
                            page === pageNum 
                              ? "bg-[#16a34a] text-white hover:bg-[#15803d] border-[#16a34a]" 
                              : ""
                          }`}
                        >
                          {pageNum}
                        </Button>
                      )
                    })}
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={page === totalPages}
                    className="h-8"
                  >
                    Next
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

