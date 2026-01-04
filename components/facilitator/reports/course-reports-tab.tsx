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
import { useGetFacilitatorCourseReportsQuery, useLazyExportFacilitatorCourseReportsQuery } from "@/lib/store/api/userApi";
import { Skeleton } from "@/components/ui/skeleton";

export default function CourseReportsTab() {
  const locale = useLocale();
  const { data: reportsData, isLoading } = useGetFacilitatorCourseReportsQuery();
  const [triggerExport, { isLoading: isExporting }] = useLazyExportFacilitatorCourseReportsQuery();

  const courses = reportsData?.data?.courses || [];

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
        <h2 className="text-lg font-medium text-[#1a1a1a]">Course Report</h2>
        <Button 
          className="bg-[#00B140] hover:bg-[#00B140]/90 text-white"
          onClick={handleExport}
          disabled={isExporting}
        >
          <Download className="w-4 h-4 mr-2" />
          {isExporting ? 'Exporting...' : 'Export Report'}
        </Button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="border-b">
              <TableHead className="text-sm font-normal text-muted-foreground">Course Name</TableHead>
              <TableHead className="text-sm font-normal text-muted-foreground">Team</TableHead>
              <TableHead className="text-sm font-normal text-muted-foreground">Enrolled</TableHead>
              <TableHead className="text-sm font-normal text-muted-foreground">Completed</TableHead>
              <TableHead className="text-sm font-normal text-muted-foreground">In Progress</TableHead>
              <TableHead className="text-sm font-normal text-muted-foreground">Not Started</TableHead>
              <TableHead className="text-sm font-normal text-muted-foreground">Avg Score</TableHead>
              <TableHead className="text-sm font-normal text-muted-foreground">Certificates</TableHead>
              <TableHead className="text-sm font-normal text-muted-foreground">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                </TableRow>
              ))
            ) : courses.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="h-32 text-center text-muted-foreground">
                  No course reports found.
                </TableCell>
              </TableRow>
            ) : (
              courses.map((course) => (
                <TableRow key={`${course.course_id}-${course.team_id}`} className="border-b hover:bg-muted/30 transition-colors">
                  <TableCell>
                    <span className="font-medium text-sm text-foreground">{course.course_name}</span>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {course.team}
                  </TableCell>
                  <TableCell className="text-sm text-foreground">
                    {course.enrolled}
                  </TableCell>
                  <TableCell className="text-sm text-foreground">
                    {course.completed}
                  </TableCell>
                  <TableCell className="text-sm text-foreground">
                    {course.in_progress}
                  </TableCell>
                  <TableCell className="text-sm text-foreground">
                    {course.not_started}
                  </TableCell>
                  <TableCell className="text-sm text-foreground">
                    {course.avg_score}%
                  </TableCell>
                  <TableCell className="text-sm text-foreground">
                    {course.certificates}
                  </TableCell>
                  <TableCell>
                    <Link 
                      href={`/${locale}/facilitator/courses/${course.course_id}`}
                      className="text-sm text-[#00B140] hover:underline"
                    >
                      View Details
                    </Link>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
