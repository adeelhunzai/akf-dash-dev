"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, ChevronLeft, ChevronRight, ArrowRight } from "lucide-react";
import { useGetManagerCoursesQuery, useGetTeamsDropdownQuery } from "@/lib/store/api/managerApi";
import Link from "next/link";
import ListItemsModal from "@/components/manager/learners/list-items-modal";

interface CourseTeam {
  id: number;
  name: string;
}

interface Course {
  id: number;
  name: string;
  start_date: string;
  team: CourseTeam | null;
  teams: CourseTeam[];
  learners_count: number;
  status: string;
}

export default function CoursesList() {
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedTeam, setSelectedTeam] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [teamsModal, setTeamsModal] = useState<{ open: boolean; items: { id: number; name: string }[] }>({
    open: false,
    items: [],
  });

  // Debounce search input - 500ms delay
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput);
      setPage(1);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchInput]);

  // Fetch teams for dropdown
  const { data: teamsData } = useGetTeamsDropdownQuery({});
  const teams: CourseTeam[] = teamsData?.data || [];

  // Fetch courses
  const { data, isLoading } = useGetManagerCoursesQuery({
    page,
    per_page: perPage,
    search: debouncedSearch || undefined,
    team_id: selectedTeam !== "all" ? parseInt(selectedTeam) : undefined,
    status: selectedStatus,
  });

  const courses: Course[] = data?.data || [];
  const totalPages = data?.total_pages || 1;
  const total = data?.total || 0;

  // Format date for display
  const formatDate = (dateString: string) => {
    if (!dateString) return "";
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

  // Render teams with modal on "more" click
  const renderTeams = (teams: CourseTeam[]) => {
    if (!teams || teams.length === 0) {
      return <span className="text-gray-400">—</span>;
    }

    const displayTeams = teams.slice(0, 2);
    const remainingCount = teams.length - 2;

    return (
      <div className="flex items-center gap-1 text-[#1a1a1a]">
        {displayTeams.map((team, teamIdx) => (
          <span key={team.id}>
            {team.name}{teamIdx < displayTeams.length - 1 ? ',' : ''}
          </span>
        ))}
        {remainingCount > 0 && (
          <span 
            className="text-gray-500 cursor-pointer hover:text-[#00B140] ml-1"
            onClick={() => setTeamsModal({ open: true, items: teams })}
          >
            +{remainingCount} more
          </span>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-[#1a1a1a]">Courses</h1>

      <Card className="border border-gray-100 shadow-sm bg-white">
        <CardContent className="p-6">
          {/* Filters Row */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input 
                placeholder="Search courses or teams" 
                className="pl-10 h-11 border-gray-200"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
              />
            </div>

            {/* Team Filter */}
            <Select value={selectedTeam} onValueChange={(v) => { setSelectedTeam(v); setPage(1); }}>
              <SelectTrigger className="w-[160px] h-11 border-gray-200">
                <SelectValue placeholder="All Teams" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Teams</SelectItem>
                {teams.map((team) => (
                  <SelectItem key={team.id} value={team.id.toString()}>
                    {team.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Status Filter */}
            <Select value={selectedStatus} onValueChange={(v) => { setSelectedStatus(v); setPage(1); }}>
              <SelectTrigger className="w-[140px] h-11 border-gray-200">
                <SelectValue placeholder="Status: All" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Status: All</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          <div className="rounded-md border border-gray-100 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-[#F9FAFB] hover:bg-[#F9FAFB]">
                  <TableHead className="font-semibold text-gray-500 h-12 pl-6">Course Name</TableHead>
                  <TableHead className="font-semibold text-gray-500 h-12">Team</TableHead>
                  <TableHead className="font-semibold text-gray-500 h-12 text-center">Learners</TableHead>
                  <TableHead className="font-semibold text-gray-500 h-12 text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="pl-6"><Skeleton className="h-10 w-64" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-8 mx-auto" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24 mx-auto" /></TableCell>
                    </TableRow>
                  ))
                ) : courses.length > 0 ? (
                  courses.map((course) => (
                    <TableRow key={course.id} className="hover:bg-gray-50/50">
                      <TableCell className="py-4 pl-6">
                        <div className="flex flex-col">
                          <span className="font-medium text-[#1a1a1a]">{course.name}</span>
                          <span className="text-xs text-gray-500">
                            Started: {formatDate(course.start_date)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="py-4">
                        {renderTeams(course.teams)}
                      </TableCell>
                      <TableCell className="py-4 text-center">
                        <span className="font-medium text-[#1a1a1a]">{course.learners_count}</span>
                      </TableCell>
                      <TableCell className="py-4 text-center">
                        <Link 
                          href={`/manager/courses/${course.id}`}
                          className="inline-flex items-center text-[#00B140] hover:text-[#00B140]/80 font-medium text-sm"
                        >
                          View Details
                          <ArrowRight className="w-4 h-4 ml-1" />
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center">
                      No courses found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 0 && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100">
              <div className="flex items-center gap-4">
                <div className="text-sm text-gray-500">
                  Showing {((page - 1) * perPage) + 1} to{" "}
                  {Math.min(page * perPage, total)} of{" "}
                  {total} courses
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
        </CardContent>
      </Card>

      {/* Modal for viewing all teams */}
      <ListItemsModal
        open={teamsModal.open}
        onOpenChange={(open) => setTeamsModal({ ...teamsModal, open })}
        title="All Teams"
        items={teamsModal.items}
      />
    </div>
  );
}
