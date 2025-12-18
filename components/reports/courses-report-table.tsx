"use client"

import { useState, useEffect, useMemo, useRef } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useGetCourseReportQuery } from "@/lib/store/api/reportsApi"
import { Skeleton } from "@/components/ui/skeleton"
import { CourseDetailsModal } from "./course-details-modal"
import { CourseReportItem } from "@/lib/types/reports.types"

interface CoursesReportTableProps {
  searchQuery?: string;
  dateRange?: string;
  onVisibleRowsChange?: (rows: CourseReportItem[]) => void;
  onLoadingChange?: (loading: boolean) => void;
}

export function CoursesReportTable({
  searchQuery = "",
  dateRange = "0",
  onVisibleRowsChange,
  onLoadingChange,
}: CoursesReportTableProps) {
  const [currentPage, setCurrentPage] = useState(1)
  const [perPage, setPerPage] = useState(10)
  const [selectedCourse, setSelectedCourse] = useState<CourseReportItem | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  // Convert dateRange to days
  const days = dateRange === "0" ? undefined : parseInt(dateRange)

  // Fetch data from API
  const { data, isLoading, isFetching, error } = useGetCourseReportQuery({
    page: currentPage,
    per_page: perPage,
    search: searchQuery || undefined,
    days: days,
  })

  // Reset to page 1 when search or date range changes
  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, dateRange])

  const coursesData = useMemo(() => data?.data || [], [data?.data])
  const totalItems = data?.total || 0
  const totalPages = Math.ceil(totalItems / perPage)
  const startIndex = (currentPage - 1) * perPage
  const endIndex = Math.min(startIndex + perPage, totalItems)

  // Helper function to generate page numbers with ellipsis logic
  const getPageNumbers = () => {
    const pages: (number | string)[] = []

    if (totalPages <= 7) {
      // Show all pages if 7 or fewer
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      // Always show first page
      pages.push(1)

      // Calculate range around current page
      let start = Math.max(2, currentPage - 1)
      let end = Math.min(totalPages - 1, currentPage + 1)

      // Adjust if near beginning
      if (currentPage <= 3) {
        start = 2
        end = 5
      }

      // Adjust if near end
      if (currentPage >= totalPages - 2) {
        start = totalPages - 4
        end = totalPages - 1
      }

      // Add ellipsis after first page if needed
      if (start > 2) {
        pages.push('...')
      }

      // Add middle pages
      for (let i = start; i <= end; i++) {
        pages.push(i)
      }

      // Add ellipsis before last page if needed
      if (end < totalPages - 1) {
        pages.push('...')
      }

      // Always show last page
      pages.push(totalPages)
    }

    return pages
  }

  // Handle per page change
  const handlePerPageChange = (value: string) => {
    setPerPage(parseInt(value))
    setCurrentPage(1) // Reset to first page when changing page size
  }

  const previousCourseIds = useRef<string[]>([])

  useEffect(() => {
    if (!onVisibleRowsChange) return

    const currentIds = coursesData.map((course) => course.id)
    const hasSameIds =
      currentIds.length === previousCourseIds.current.length &&
      currentIds.every((id, index) => id === previousCourseIds.current[index])

    if (hasSameIds) return

    previousCourseIds.current = currentIds
    onVisibleRowsChange(coursesData)
  }, [coursesData, onVisibleRowsChange])

  useEffect(() => {
    if (!onLoadingChange) return
    onLoadingChange(isLoading || isFetching)
  }, [isLoading, isFetching, onLoadingChange])

  if (error) {
    return (
      <div className="bg-white p-6 rounded-lg border border-red-200">
        <p className="text-red-600">Error loading course report. Please try again.</p>
      </div>
    )
  }

  return (
    <div>
      {/* Table */}
      <div className="bg-white rounded-md border border-gray-200 shadow-sm overflow-hidden">
          <Table className="min-w-[1100px]">
          <TableHeader>
            <TableRow className="border-b border-gray-200 bg-[#F3F4F6]">
              <TableHead className="text-xs font-medium uppercase text-gray-500 py-3 px-4">Course ID</TableHead>
              <TableHead className="text-xs font-medium uppercase text-gray-500 py-3 px-4">Course Name ↑</TableHead>
              <TableHead className="text-center text-xs font-medium uppercase text-gray-500 py-3 px-4">Enrolled</TableHead>
              <TableHead className="text-center text-xs font-medium uppercase text-gray-500 py-3 px-4">Not Started</TableHead>
              <TableHead className="text-center text-xs font-medium uppercase text-gray-500 py-3 px-4">In Progress</TableHead>
              <TableHead className="text-center text-xs font-medium uppercase text-gray-500 py-3 px-4">Completed</TableHead>
              <TableHead className="text-center text-xs font-medium uppercase text-gray-500 py-3 px-4">Completion Rate</TableHead>
              <TableHead className="text-center text-xs font-medium uppercase text-gray-500 py-3 px-4">Quiz Score</TableHead>
              <TableHead className="text-center text-xs font-medium uppercase text-gray-500 py-3 px-4">Avg Time</TableHead>
              <TableHead className="text-center text-xs font-medium uppercase text-gray-500 py-3 px-4">Certificates</TableHead>
              <TableHead className="text-center text-xs font-medium uppercase text-gray-500 py-3 px-4">CPD Certificates</TableHead>
              <TableHead className="text-center text-xs font-medium uppercase text-gray-500 py-3 px-4">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading || isFetching ? (
              // Loading skeleton
              Array.from({ length: perPage }).map((_, index) => (
                <TableRow key={index} className="border-b border-gray-200">
                  <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-12 mx-auto" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-12 mx-auto" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-12 mx-auto" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-12 mx-auto" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-16 mx-auto" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-16 mx-auto" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-16 mx-auto" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-12 mx-auto" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-12 mx-auto" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20 mx-auto" /></TableCell>
                </TableRow>
              ))
            ) : coursesData.length > 0 ? (
              coursesData.map((course) => (
                <TableRow key={course.id} className="border-b border-gray-200 hover:bg-gray-50">
                  <TableCell className="font-normal text-sm text-gray-900 py-4 px-4">{course.id}</TableCell>
                  <TableCell className="font-normal text-sm py-4 px-4">
                    <a 
                      href={course.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-gray-900 hover:text-[#00B140] hover:underline transition-colors"
                    >
                      {course.name}
                    </a>
                  </TableCell>
                  <TableCell className="text-center text-sm text-gray-900 py-4 px-4">{course.enrolled.toLocaleString()}</TableCell>
                  <TableCell className="text-center text-sm text-gray-900 py-4 px-4">{course.notStarted.toLocaleString()}</TableCell>
                  <TableCell className="text-center text-sm text-gray-900 py-4 px-4">{course.inProgress.toLocaleString()}</TableCell>
                  <TableCell className="text-center text-sm text-gray-900 py-4 px-4">{course.completed.toLocaleString()}</TableCell>
                  <TableCell className="text-center text-sm text-gray-900 py-4 px-4">{course.completionRate}</TableCell>
                  <TableCell className="text-center text-sm text-gray-900 py-4 px-4">{course.quizScore}</TableCell>
                  <TableCell className="text-center text-sm text-gray-900 py-4 px-4">{course.avgTime}</TableCell>
                  <TableCell className="text-center text-sm text-gray-900 py-4 px-4">{course.certificatesIssued}</TableCell>
                  <TableCell className="text-center text-sm text-gray-900 py-4 px-4">{course.cpdCertificatesIssued}</TableCell>
                  <TableCell className="text-center py-4 px-4">
                    <button
                      onClick={() => {
                        setSelectedCourse(course)
                        setIsModalOpen(true)
                      }}
                      className="text-sm font-medium text-[#00B140] hover:text-[#009636] cursor-pointer"
                    >
                      See details
                    </button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={12} className="text-center py-8 text-muted-foreground">
                  No courses found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
          </Table>
      </div>

      {/* Pagination */}
      {totalPages > 0 && (
        <div className="flex items-center justify-between px-6 py-4 border-t border-border">
          <div className="flex items-center gap-4">
            <div className="text-sm text-muted-foreground">
              Showing {startIndex + 1} to {Math.min(endIndex, totalItems)} of {totalItems} courses
            </div>
            
            {/* Per Page Selector */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Show:</span>
              <Select value={perPage.toString()} onValueChange={handlePerPageChange}>
                <SelectTrigger className="h-8 w-[70px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5</SelectItem>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="30">30</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={currentPage === 1}
              className="h-8"
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </Button>

            {/* Page Numbers with Ellipsis */}
            <div className="flex items-center gap-1">
              {getPageNumbers().map((page, index) => {
                if (page === '...') {
                  return (
                    <span key={`ellipsis-${index}`} className="px-2 text-muted-foreground">
                      ...
                    </span>
                  )
                }
                return (
                  <Button
                    key={page}
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(page as number)}
                    className={`h-8 min-w-8 px-2 ${
                      currentPage === page
                        ? "bg-[#16a34a] text-white hover:bg-[#15803d] border-[#16a34a]"
                        : ""
                    }`}
                  >
                    {page}
                  </Button>
                )
              })}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="h-8"
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Course Details Modal */}
      <CourseDetailsModal
        course={selectedCourse}
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
      />
    </div>
  )
}
