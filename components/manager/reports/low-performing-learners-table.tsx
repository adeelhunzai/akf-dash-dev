"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Eye, ChevronLeft, ChevronRight } from "lucide-react";
import { useGetLowPerformingLearnersQuery } from "@/lib/store/api/managerApi";
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
import { useState, useEffect } from "react";
import LearnerDetailsModal from "./learner-details-modal";

export default function LowPerformingLearnersTable({ allReports }: { allReports?: boolean }) {
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [selectedLearner, setSelectedLearner] = useState<any>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  const { data: learnersData, isLoading, isFetching } = useGetLowPerformingLearnersQuery({ page, per_page: perPage, all_reports: allReports });
  const learners = learnersData?.data || [];
  const totalPages = learnersData?.total_pages || 1;
  const total = learnersData?.total || 0;

  // Reset page when allReports changes
  useEffect(() => {
    setPage(1);
  }, [allReports]);

  const handleViewLearner = (learner: any) => {
    setSelectedLearner(learner);
    setIsDetailsModalOpen(true);
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

  return (
    <div>
      <Card className="border border-gray-200 shadow-sm rounded-xl mt-8 bg-white">
        <CardHeader className="flex flex-col md:flex-row md:items-center justify-between p-6 border-b border-gray-200 rounded-t-xl bg-white">
          <div>
            <CardTitle className="text-lg font-bold text-[#1a1a1a]">
              Low Performing Learners
            </CardTitle>
            <p className="text-sm text-gray-500 font-normal mt-1">
              Learners with scores below 65% requiring attention
            </p>
          </div>
          <div className="flex gap-3 mt-4 md:mt-0">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded bg-red-50 text-red-600 text-xs font-medium border border-red-100">
              <span className="w-2 h-2 rounded-full bg-red-600"></span>
              Critical (&lt; 55%)
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded bg-yellow-50 text-yellow-700 text-xs font-medium border border-yellow-100">
              <span className="w-2 h-2 rounded-full bg-yellow-600"></span>
              Warning (55-65%)
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-[#F9FAFB] hover:bg-[#F9FAFB] border-b border-gray-100">
                <TableHead className="w-[200px] font-semibold text-gray-500 pl-6">Learner</TableHead>
                <TableHead className="font-semibold text-gray-500">Team</TableHead>
                <TableHead className="font-semibold text-gray-500">Department</TableHead>
                <TableHead className="font-semibold text-gray-500">Facilitator</TableHead>
                <TableHead className="font-semibold text-gray-500">Score</TableHead>
                <TableHead className="font-semibold text-gray-500">Progress</TableHead>
                <TableHead className="text-right font-semibold text-gray-500 pr-6">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading || isFetching ? (
                Array.from({ length: 5 }).map((_, idx) => (
                  <TableRow key={idx} className="border-b border-gray-100">
                    <TableCell className="pl-6"><Skeleton className="h-10 w-40" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell className="pr-6"><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : learners.length > 0 ? (
                learners.map((learner: any) => (
                  <TableRow key={learner.id} className="border-b border-gray-100 hover:bg-gray-50/50">
                    <TableCell className="pl-6 py-4">
                      <div className="flex items-center gap-3">
                        <Avatar className={`w-9 h-9 ${learner.color || 'bg-gray-200'}`}>
                          <AvatarFallback className="text-white text-xs font-medium bg-transparent">
                            {learner.initials}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-medium text-[#1a1a1a]">{learner.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="py-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-[#1a1a1a]">{learner.team}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-gray-500 py-4 max-w-[150px] truncate">{learner.department}</TableCell>
                    <TableCell className="text-gray-500 py-4">{learner.facilitator}</TableCell>
                    <TableCell className="py-4">
                      <div className="flex items-center gap-2">
                         <span className={`text-lg font-bold ${learner.status === 'critical' ? 'text-[#EF4444]' : 'text-[#F59E0B]'}`}>
                          {learner.score}%
                        </span>
                        <Badge 
                          variant="outline" 
                          className={`
                            ${learner.status === 'critical' 
                              ? 'bg-red-50 text-red-600 border-red-100' 
                              : 'bg-yellow-50 text-yellow-600 border-yellow-100'
                            } 
                            font-normal text-[10px] px-2 py-0.5 h-auto rounded-sm capitalize
                          `}
                        >
                          {learner.status}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell className="py-4">
                      <div className="w-[140px]">
                        <div className="flex justify-between text-xs mb-1.5">
                          <span className="font-medium text-gray-700">{learner.courses_completed}/{learner.courses_total} courses</span>
                        </div>
                        <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full ${learner.status === 'critical' ? 'bg-[#EF4444]' : 'bg-[#F59E0B]'}`} 
                            style={{ width: `${(learner.courses_completed / learner.courses_total) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right pr-6 py-4">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-gray-400 hover:text-gray-600"
                        onClick={() => handleViewLearner(learner)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center text-gray-500">
                    No low performing learners found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

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

      <LearnerDetailsModal 
        open={isDetailsModalOpen} 
        onOpenChange={setIsDetailsModalOpen} 
        learner={selectedLearner} 
      />
    </div>
  );
}
