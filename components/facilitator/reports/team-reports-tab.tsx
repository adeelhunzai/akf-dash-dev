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
import { useGetFacilitatorTeamReportsQuery, useLazyExportFacilitatorTeamReportsQuery } from "@/lib/store/api/userApi";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";
import { ReportsPagination } from "@/components/facilitator/reports/reports-pagination";

export default function TeamReportsTab() {
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(5);
  const { data: reportsData, isLoading, isFetching } = useGetFacilitatorTeamReportsQuery({ page, per_page: perPage });
  const [triggerExport, { isLoading: isExporting }] = useLazyExportFacilitatorTeamReportsQuery();

  const teams = reportsData?.data?.teams || [];
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
        <h2 className="text-lg font-medium text-[#1a1a1a]">Team Reports</h2>
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
              <TableHead className="text-sm font-normal text-muted-foreground">Team Name</TableHead>
              <TableHead className="text-sm font-normal text-muted-foreground">Learners</TableHead>
              <TableHead className="text-sm font-normal text-muted-foreground">Courses Assigned</TableHead>
              <TableHead className="text-sm font-normal text-muted-foreground">Completed</TableHead>
              <TableHead className="text-sm font-normal text-muted-foreground">Avg Score</TableHead>
              <TableHead className="text-sm font-normal text-muted-foreground">Certificates</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isFetching ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                </TableRow>
              ))
            ) : teams.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                  No team reports found.
                </TableCell>
              </TableRow>
            ) : (
              teams.map((team) => (
                <TableRow key={team.team_id} className="border-b hover:bg-muted/30 transition-colors">
                  <TableCell>
                    <span className="font-medium text-sm text-foreground">{team.team_name}</span>
                  </TableCell>
                  <TableCell className="text-sm text-foreground">
                    {team.learners}
                  </TableCell>
                  <TableCell className="text-sm text-foreground">
                    {team.courses_assigned}
                  </TableCell>
                  <TableCell className="text-sm text-foreground">
                    {team.completed}
                  </TableCell>
                  <TableCell className="text-sm text-foreground">
                    {team.avg_score}%
                  </TableCell>
                  <TableCell className="text-sm text-foreground">
                    {team.certificates}
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
          itemName="teams"
        />
      )}
    </div>
  );
}
