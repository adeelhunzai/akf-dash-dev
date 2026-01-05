"use client";

import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Download } from "lucide-react";
import Link from "next/link";
import { useLocale } from "next-intl";
import { useGetFacilitatorLearnerReportsQuery, useLazyExportFacilitatorLearnerReportsQuery } from "@/lib/store/api/userApi";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";
import { ReportsPagination } from "@/components/facilitator/reports/reports-pagination";

export default function LearnerReportsTab() {
  const locale = useLocale();
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(5);
  const { data: reportsData, isLoading, isFetching } = useGetFacilitatorLearnerReportsQuery({ page, per_page: perPage });
  const [triggerExport, { isLoading: isExporting }] = useLazyExportFacilitatorLearnerReportsQuery();

  const learners = reportsData?.data?.learners || [];
  const pagination = reportsData?.data?.pagination;

  const handleExport = async () => {
    try {
      const result = await triggerExport().unwrap();
      if (result.success && result.data) {
        // Create and download CSV
        const blob = new Blob([result.data.csv], { type: 'text/csv;charset=utf-8;' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = result.data.filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  return (
    <div className="border border-gray-200 rounded-md bg-white">
      {/* Header with Export */}
      <div className="p-4 border-b border-gray-200 flex justify-between items-center">
        <h2 className="text-lg font-medium text-[#1a1a1a]">Learner Reports</h2>
        <Button 
          className="bg-[#00B140] hover:bg-[#00B140]/90 text-white"
          onClick={handleExport}
          disabled={isExporting}
        >
          <Download className="w-4 h-4 mr-2" />
          {isExporting ? 'Exporting...' : 'Export CSV'}
        </Button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="border-b">
              <TableHead className="text-sm font-normal text-muted-foreground">Learner</TableHead>
              <TableHead className="text-sm font-normal text-muted-foreground">Courses Enrolled</TableHead>
              <TableHead className="text-sm font-normal text-muted-foreground">Courses Completed</TableHead>
              <TableHead className="text-sm font-normal text-muted-foreground">Courses In Progress</TableHead>
              <TableHead className="text-sm font-normal text-muted-foreground">Courses Not Started</TableHead>
              <TableHead className="text-sm font-normal text-muted-foreground">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isFetching ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-10 w-48" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                </TableRow>
              ))
            ) : learners.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                  No learner reports found.
                </TableCell>
              </TableRow>
            ) : (
              learners.map((learner) => (
                <TableRow key={learner.id} className="border-b hover:bg-muted/30 transition-colors">
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium text-sm text-foreground">{learner.name}</span>
                      <span className="text-xs text-muted-foreground">{learner.email}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-foreground">
                    {learner.courses_enrolled}
                  </TableCell>
                  <TableCell className="text-sm font-semibold text-foreground">
                    {learner.courses_completed}
                  </TableCell>
                  <TableCell className="text-sm text-foreground">
                    {learner.courses_in_progress}
                  </TableCell>
                  <TableCell className="text-sm text-foreground">
                    {learner.courses_not_started}
                  </TableCell>
                  <TableCell>
                    <Link 
                      href={`/${locale}/facilitator/teams?learner=${learner.id}&source=reports`}
                      className="text-sm text-[#00B140] hover:underline"
                    >
                      View Detail
                    </Link>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {pagination && (
        <ReportsPagination
          totalItems={pagination.total_items}
          itemsPerPage={perPage}
          currentPage={page}
          onPageChange={setPage}
          onRowsPerPageChange={(newPerPage) => {
            setPerPage(newPerPage);
            setPage(1);
          }}
          itemName="learners"
        />
      )}
    </div>
  );
}
