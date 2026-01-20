"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
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
import { Button } from "@/components/ui/button";
import { Search, ChevronLeft, ChevronRight } from "lucide-react";
import { useGetManagerLearnersQuery } from "@/lib/store/api/managerApi";
import { useLocale } from "next-intl";
import ListItemsModal from "./list-items-modal";
import LearnerProfileModal from "./learner-profile-modal";

interface Team {
  id: number;
  name: string;
}

interface Course {
  id: number;
  name: string;
}

interface Learner {
  id: number;
  name: string;
  email: string;
  initials: string;
  teams: Team[];
  courses_enrolled_count: number;
  courses: Course[];
}

interface ModalState {
  open: boolean;
  title: string;
  items: { id: number; name: string }[];
}

export default function LearnersList() {
  const locale = useLocale();
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedLearners, setSelectedLearners] = useState<number[]>([]);
  const [listModal, setListModal] = useState<ModalState>({ open: false, title: "", items: [] });
  const [viewUserModal, setViewUserModal] = useState<{ open: boolean; userId: number | undefined }>({ open: false, userId: undefined });

  // Debounce search - wait 500ms after user stops typing
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1); // Reset to first page when search changes
    }, 500);

    return () => clearTimeout(timer);
  }, [search]);

  const { data, isLoading } = useGetManagerLearnersQuery({
    page,
    per_page: perPage,
    search: debouncedSearch || undefined
  });

  const learners: Learner[] = data?.data || [];
  const totalPages = data?.total_pages || 1;
  const total = data?.total || 0;

  // Handle select all
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedLearners(learners.map(l => l.id));
    } else {
      setSelectedLearners([]);
    }
  };

  // Handle individual selection
  const handleSelectLearner = (learnerId: number, checked: boolean) => {
    if (checked) {
      setSelectedLearners(prev => [...prev, learnerId]);
    } else {
      setSelectedLearners(prev => prev.filter(id => id !== learnerId));
    }
  };

  // Helper function to generate page numbers with ellipsis logic
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

  // Render course badges with modal on "more" click
  const renderCourseBadges = (courses: Course[], totalCount: number) => {
    const displayCourses = courses.slice(0, 2);
    const remainingCount = totalCount - displayCourses.length;

    return (
      <div className="flex flex-wrap gap-1.5">
        {displayCourses.map((course) => (
          <Badge 
            key={course.id} 
            variant="outline" 
            className="bg-[#E8F5E9] text-[#2E7D32] border-[#C8E6C9] font-medium text-xs px-2 py-0.5"
          >
            {course.name.length > 18 ? course.name.substring(0, 18) + '...' : course.name}
          </Badge>
        ))}
        {remainingCount > 0 && (
          <Badge 
            variant="outline" 
            className="bg-gray-100 text-gray-600 border-gray-200 font-medium text-xs px-2 py-0.5 cursor-pointer hover:bg-gray-200"
            onClick={() => setListModal({ open: true, title: "All Courses", items: courses })}
          >
            +{remainingCount} more
          </Badge>
        )}
      </div>
    );
  };

  // Render teams with modal on "more" click
  const renderTeams = (teams: Team[]) => {
    if (!teams || teams.length === 0) {
      return <span className="text-gray-400">-</span>;
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
            onClick={() => setListModal({ open: true, title: "All Teams", items: teams })}
          >
            +{remainingCount} more
          </span>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-[#1a1a1a]">Learners</h1>

      <Card className="border border-gray-100 shadow-sm bg-white">
        <CardContent className="p-6">
          {/* Search */}
          <div className="relative mb-6 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input 
              placeholder="Search learners by names" 
              className="pl-10 h-11 border-gray-200"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Table */}
          <div className="rounded-md border border-gray-100">
            <Table>
              <TableHeader>
                <TableRow className="bg-[#F9FAFB] hover:bg-[#F9FAFB]">
                  <TableHead className="w-[50px] pl-4">
                    <Checkbox 
                      checked={learners.length > 0 && selectedLearners.length === learners.length}
                      onCheckedChange={handleSelectAll}
                    />
                  </TableHead>
                  <TableHead className="font-semibold text-gray-500 uppercase text-xs tracking-wide h-12">Name</TableHead>
                  <TableHead className="font-semibold text-gray-500 uppercase text-xs tracking-wide h-12">Email</TableHead>
                  <TableHead className="font-semibold text-gray-500 uppercase text-xs tracking-wide h-12">Team</TableHead>
                  <TableHead className="font-semibold text-gray-500 uppercase text-xs tracking-wide h-12 w-[100px]">Course Enrolled</TableHead>
                  <TableHead className="font-semibold text-gray-500 uppercase text-xs tracking-wide h-12">Courses</TableHead>
                  <TableHead className="font-semibold text-gray-500 uppercase text-xs tracking-wide h-12">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 6 }).map((_, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="pl-4"><Skeleton className="h-4 w-4" /></TableCell>
                      <TableCell><Skeleton className="h-10 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-8" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-40" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                    </TableRow>
                  ))
                ) : learners.length > 0 ? (
                  learners.map((learner, idx) => (
                    <TableRow key={learner.id} className="hover:bg-gray-50/50">
                      <TableCell className="pl-4 py-4">
                        <Checkbox 
                          checked={selectedLearners.includes(learner.id)}
                          onCheckedChange={(checked) => handleSelectLearner(learner.id, checked as boolean)}
                        />
                      </TableCell>
                      <TableCell className="py-4">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9 bg-[#00B140]">
                            <AvatarFallback className="text-white bg-[#00B140] font-semibold text-sm">
                              {learner.initials}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium text-[#1a1a1a]">{learner.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="py-4 text-gray-600">
                        {learner.email}
                      </TableCell>
                      <TableCell className="py-4">
                        {renderTeams(learner.teams)}
                      </TableCell>
                      <TableCell className="py-4 text-center">
                        <span className="text-[#1a1a1a] font-medium">{learner.courses_enrolled_count}</span>
                      </TableCell>
                      <TableCell className="py-4">
                        {learner.courses.length > 0 ? (
                          renderCourseBadges(learner.courses, learner.courses_enrolled_count)
                        ) : (
                          <span className="text-gray-400 text-sm">No courses</span>
                        )}
                      </TableCell>
                      <TableCell className="py-4">
                        <button
                          onClick={() => setViewUserModal({ open: true, userId: learner.id })}
                          className="text-[#00B140] hover:text-[#009933] font-medium text-sm hover:underline"
                        >
                          View Profile
                        </button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center text-gray-500">
                      No learners found.
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
                  {total} learners
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

      {/* Modal for viewing all items */}
      <ListItemsModal
        open={listModal.open}
        onOpenChange={(open) => setListModal({ ...listModal, open })}
        title={listModal.title}
        items={listModal.items}
      />

      {/* Modal for viewing learner profile */}
      <LearnerProfileModal
        open={viewUserModal.open}
        onOpenChange={(open) => setViewUserModal({ ...viewUserModal, open })}
        learnerId={viewUserModal.userId}
      />
    </div>
  );
}
