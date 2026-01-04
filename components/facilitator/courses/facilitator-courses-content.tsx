"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useGetFacilitatorCoursesQuery } from "@/lib/store/api/userApi";
import { Skeleton } from "@/components/ui/skeleton";

export default function FacilitatorCoursesContent() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTeam, setSelectedTeam] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const perPage = 10;

  // Fetch courses data from API
  const { data, isLoading, isError, isFetching } = useGetFacilitatorCoursesQuery({
    search: searchQuery || undefined,
    team: selectedTeam !== "all" ? parseInt(selectedTeam) : undefined,
    status: selectedStatus !== "all" ? selectedStatus : undefined,
    page: currentPage,
    per_page: perPage,
  });

  const courses = data?.data?.courses || [];
  const pagination = data?.data?.pagination;
  const availableGroups = data?.data?.filters?.available_groups || [];

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Courses Managed</h1>
      </div>

      {/* Search and Filters Card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search Input */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search courses or teams"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1); // Reset to first page on search
                }}
                className="pl-10"
              />
            </div>

            {/* Team Filter */}
            <Select value={selectedTeam} onValueChange={(value) => {
              setSelectedTeam(value);
              setCurrentPage(1);
            }}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="All Teams" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Teams</SelectItem>
                {availableGroups.map((group) => (
                  <SelectItem key={group.id} value={group.id.toString()}>
                    {group.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Status Filter */}
            <Select value={selectedStatus} onValueChange={(value) => {
              setSelectedStatus(value);
              setCurrentPage(1);
            }}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Status: All" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Status: All</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="upcoming">Upcoming</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Courses Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left p-4 font-medium text-sm text-muted-foreground">
                    Course Name
                  </th>
                  <th className="text-left p-4 font-medium text-sm text-muted-foreground">
                    Team
                  </th>
                  <th className="text-left p-4 font-medium text-sm text-muted-foreground">
                    Learners
                  </th>
                  <th className="text-left p-4 font-medium text-sm text-muted-foreground">
                    Status
                  </th>
                  <th className="text-left p-4 font-medium text-sm text-muted-foreground">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {isLoading || isFetching ? (
                  // Loading skeleton
                  Array.from({ length: 5 }).map((_, idx) => (
                    <tr key={idx} className="border-b">
                      <td className="p-4">
                        <Skeleton className="h-12 w-full" />
                      </td>
                      <td className="p-4">
                        <Skeleton className="h-6 w-24" />
                      </td>
                      <td className="p-4">
                        <Skeleton className="h-6 w-16" />
                      </td>
                      <td className="p-4">
                        <Skeleton className="h-6 w-20" />
                      </td>
                      <td className="p-4">
                        <Skeleton className="h-8 w-28" />
                      </td>
                    </tr>
                  ))
                ) : isError ? (
                  // Error state
                  <tr>
                    <td colSpan={5} className="p-12 text-center">
                      <p className="text-destructive">Failed to load courses. Please try again.</p>
                    </td>
                  </tr>
                ) : courses.length === 0 ? (
                  // Empty state
                  <tr>
                    <td colSpan={5} className="p-12 text-center">
                      <p className="text-muted-foreground">No courses found matching your criteria.</p>
                    </td>
                  </tr>
                ) : (
                  // Data rows
                  courses.map((course) => (
                    <tr key={course.id} className="border-b hover:bg-muted/30 transition-colors">
                      <td className="p-4">
                        <div>
                          <div className="font-medium text-foreground">{course.title}</div>
                          <div className="text-sm text-muted-foreground">
                            Started: {course.start_date}
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-foreground">
                        {course.groups.length > 0 ? course.groups.join(", ") : "N/A"}
                      </td>
                      <td className="p-4 text-foreground">
                        <div className="text-sm">
                          <div>{course.total_learners} total</div>
                          <div className="text-muted-foreground">{course.active_learners} active</div>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          course.status === 'active' ? 'bg-green-100 text-green-700' :
                          course.status === 'completed' ? 'bg-gray-100 text-gray-700' :
                          'bg-blue-100 text-blue-700'
                        }`}>
                          {course.status.charAt(0).toUpperCase() + course.status.slice(1)}
                        </span>
                      </td>
                      <td className="p-4">
                        <Link
                          href={`/facilitator/courses/${course.id}`}
                          className="inline-flex items-center gap-1 text-[#00B140] hover:text-[#00B140]/80 font-medium text-sm transition-colors"
                        >
                          View Details
                          <ArrowRight className="w-4 h-4" />
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination && pagination.total_pages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 border-t">
              <p className="text-sm text-muted-foreground">
                Showing page {pagination.current_page} of {pagination.total_pages} ({pagination.total_courses} total courses)
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1 || isFetching}
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(pagination.total_pages, prev + 1))}
                  disabled={currentPage === pagination.total_pages || isFetching}
                >
                  Next
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
