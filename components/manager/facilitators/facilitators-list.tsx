"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
import { Search, Plus, UserPlus, ChevronLeft, ChevronRight } from "lucide-react";
import { useGetManagerFacilitatorsQuery } from "@/lib/store/api/managerApi";
import ManagerAddFacilitatorDialog from "@/components/manager/facilitators/manager-add-facilitator-dialog";

export default function FacilitatorsList() {
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Debounce search input by 500ms
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput);
      setPage(1); // Reset to first page on search
    }, 500);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const { data, isLoading } = useGetManagerFacilitatorsQuery({
    page,
    per_page: perPage,
    search: debouncedSearch || undefined
  });

  const facilitators = data?.data || [];
  const totalPages = data?.total_pages || 1;


  const colors = ["bg-[#00B140]", "bg-[#2563EB]", "bg-[#F59E0B]", "bg-[#EF4444]", "bg-[#8B5CF6]"];

  // Helper function to generate page numbers with ellipsis logic (Matches Admin Dashboard)
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-3xl font-bold text-[#1a1a1a]">Facilitators</h1>
        <Button 
          className="bg-[#00B140] hover:bg-[#00B140]/90 text-white font-medium"
          onClick={() => setIsAddModalOpen(true)}
        >
          <UserPlus className="w-4 h-4 mr-2" />
          Add Facilitator
        </Button>
      </div>

      <Card className="border border-gray-100 shadow-sm bg-white">
        <CardContent className="p-6">
          {/* Search */}
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input 
              placeholder="Search facilitator by name" 
              className="pl-10 h-11 border-gray-200"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </div>

          {/* Table */}
          <div className="rounded-md border border-gray-100">
            <Table>
              <TableHeader>
                <TableRow className="bg-[#F9FAFB] hover:bg-[#F9FAFB]">
                  <TableHead className="w-[300px] font-semibold text-gray-500 pl-6 h-12">Facilitator</TableHead>
                  <TableHead className="font-semibold text-gray-500 h-12">Teams</TableHead>
                  <TableHead className="font-semibold text-gray-500 h-12">Learners</TableHead>
                  <TableHead className="font-semibold text-gray-500 h-12">Courses</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="pl-6"><Skeleton className="h-10 w-48" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                    </TableRow>
                  ))
                ) : facilitators.length > 0 ? (
                  facilitators.map((facilitator: any, idx: number) => (
                    <TableRow key={facilitator.id} className="hover:bg-gray-50/50">
                      <TableCell className="pl-6 py-4">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10 bg-[#00B140]">
                            <AvatarFallback className="text-white bg-[#00B140] font-semibold">
                              {facilitator.initials}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-semibold text-[#1a1a1a]">{facilitator.name}</div>
                            <div className="text-xs text-gray-500">{facilitator.email}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="py-4">
                        <span className="text-[#1a1a1a] font-medium">{facilitator.teams_count}</span>
                      </TableCell>
                      <TableCell className="py-4">
                        <div className="flex flex-col">
                          <span className="text-[#1a1a1a] font-bold">
                             {/* The API returns total active and total. 
                                 Design: '16 active' underneath '16 / 18' (active / total).
                                 Currently backend gives active_learners_count and learners_count (total).
                             */}
                             {facilitator.active_learners_count || 0} / {facilitator.learners_count}
                          </span>
                          <span className="text-xs text-[#10B981] font-medium">{facilitator.active_learners_count || 0} active</span>
                        </div>
                      </TableCell>
                      <TableCell className="py-4">
                        <span className="text-[#1a1a1a] font-medium">{facilitator.courses_count || 0}</span>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center">
                      No facilitators found.
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
                  {Math.min(page * perPage, data?.total || 0)} of{" "}
                  {data?.total || 0} facilitators
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

      <ManagerAddFacilitatorDialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen} />
    </div>
  );
}
