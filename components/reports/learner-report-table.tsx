"use client"

import { useState, useEffect, useMemo, useRef } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useGetLearnerReportQuery } from "@/lib/store/api/reportsApi"
import { Skeleton } from "@/components/ui/skeleton"
import { LearnerDetailsModal } from "./learner-details-modal"
import { LearnerReportItem } from "@/lib/types/reports.types"

interface LearnerReportTableProps {
  searchQuery?: string;
  dateRange?: string;
  startDate?: string;
  endDate?: string;
  onVisibleRowsChange?: (rows: LearnerReportItem[]) => void;
  onLoadingChange?: (loading: boolean) => void;
}

export function LearnerReportTable({
  searchQuery = "",
  dateRange = "0",
  startDate,
  endDate,
  onVisibleRowsChange,
  onLoadingChange,
}: LearnerReportTableProps) {
  const [currentPage, setCurrentPage] = useState(1)
  const [perPage, setPerPage] = useState(10)
  const [selectedLearner, setSelectedLearner] = useState<LearnerReportItem | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  // Convert dateRange to days
  const days = dateRange === "0" ? undefined : parseInt(dateRange)

  // Fetch data from API
  const { data, isLoading, isFetching, error } = useGetLearnerReportQuery({
    page: currentPage,
    per_page: perPage,
    search: searchQuery || undefined,
    days: days,
    start_date: startDate,
    end_date: endDate,
  })

  // Reset to page 1 when search or date range changes
  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, dateRange, startDate, endDate])

  const learnersData = useMemo(() => data?.data || [], [data?.data])
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

  if (error) {
    return (
      <div className="bg-white p-6 rounded-lg border border-red-200">
        <p className="text-red-600">Error loading learner report. Please try again.</p>
      </div>
    )
  }

  const previousLearnerIds = useRef<string[]>([])

  useEffect(() => {
    if (!onVisibleRowsChange) return

    const currentIds = learnersData.map((learner) => learner.id)
    const hasSameIds =
      currentIds.length === previousLearnerIds.current.length &&
      currentIds.every((id, index) => id === previousLearnerIds.current[index])

    if (hasSameIds) return

    previousLearnerIds.current = currentIds
    onVisibleRowsChange(learnersData)
  }, [learnersData, onVisibleRowsChange])

  useEffect(() => {
    if (!onLoadingChange) return
    onLoadingChange(isLoading || isFetching)
  }, [isLoading, isFetching, onLoadingChange])

  return (
    <div>
      {/* Table */}
      <div className="bg-white rounded-md border border-gray-200 shadow-sm overflow-hidden">
          <Table className="min-w-[900px]">
          <TableHeader>
            <TableRow className="border-b border-gray-200 bg-[#F3F4F6]">
              <TableHead className="text-xs font-medium uppercase text-gray-500 py-3 px-4">Learner ID</TableHead>
              <TableHead className="text-xs font-medium uppercase text-gray-500 py-3 px-4">Name</TableHead>
              <TableHead className="text-xs font-medium uppercase text-gray-500 py-3 px-4">Email</TableHead>
              <TableHead className="text-center text-xs font-medium uppercase text-gray-500 py-3 px-4">Courses Enrolled</TableHead>
              <TableHead className="text-center text-xs font-medium uppercase text-gray-500 py-3 px-4">
                Courses Completed
              </TableHead>
              <TableHead className="text-center text-xs font-medium uppercase text-gray-500 py-3 px-4">Total Hours</TableHead>
              <TableHead className="text-center text-xs font-medium uppercase text-gray-500 py-3 px-4">Average Score</TableHead>
              <TableHead className="text-center text-xs font-medium uppercase text-gray-500 py-3 px-4">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading || isFetching ? (
              // Loading skeleton
              Array.from({ length: perPage }).map((_, index) => (
                <TableRow key={index} className="border-b border-gray-200">
                  <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-12 mx-auto" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-12 mx-auto" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-12 mx-auto" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-16 mx-auto" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20 mx-auto" /></TableCell>
                </TableRow>
              ))
            ) : learnersData.length > 0 ? (
              learnersData.map((learner) => (
                <TableRow key={learner.id} className="border-b border-gray-200 hover:bg-gray-50">
                  <TableCell className="font-normal text-sm text-gray-900 py-4 px-4">{learner.id}</TableCell>
                  <TableCell className="font-normal text-sm text-gray-900 py-4 px-4">{learner.name}</TableCell>
                  <TableCell className="font-normal text-sm text-gray-900 py-4 px-4">{learner.email}</TableCell>
                  <TableCell className="text-center text-sm text-gray-900 py-4 px-4">{learner.coursesEnrolled}</TableCell>
                  <TableCell className="text-center text-sm text-gray-900 py-4 px-4">{learner.coursesCompleted}</TableCell>
                  <TableCell className="text-center text-sm text-gray-900 py-4 px-4">{learner.totalHours}h</TableCell>
                  <TableCell className="text-center text-sm text-gray-900 py-4 px-4">{learner.averageScore}</TableCell>
                  <TableCell className="text-center py-4 px-4">
                    <button
                      onClick={() => {
                        setSelectedLearner(learner)
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
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  No learners found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
          </Table>
      </div>

      {/* Pagination */}
      {totalPages > 0 && (
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 px-4 sm:px-6 py-4 border-t border-border mt-4">
          <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
            <div className="text-xs sm:text-sm text-muted-foreground text-center sm:text-left">
              Showing {startIndex + 1} to {Math.min(endIndex, totalItems)} of {totalItems} learners
            </div>
            
            {/* Per Page Selector */}
            <div className="flex items-center gap-2">
              <span className="text-xs sm:text-sm text-muted-foreground">Show:</span>
              <Select value={perPage.toString()} onValueChange={handlePerPageChange}>
                <SelectTrigger className="h-8 w-[60px] sm:w-[70px] text-xs sm:text-sm">
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

          <div className="flex flex-wrap items-center justify-center gap-2 w-full md:w-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={currentPage === 1}
              className="h-8 px-2 sm:px-3 text-xs sm:text-sm"
            >
              <ChevronLeft className="w-4 h-4 sm:mr-1" />
              <span className="hidden sm:inline">Previous</span>
            </Button>

            {/* Page Numbers with Ellipsis */}
            <div className="flex flex-wrap items-center justify-center gap-1">
              {getPageNumbers().map((page, index) => {
                if (page === '...') {
                  return (
                    <span key={`ellipsis-${index}`} className="px-1 sm:px-2 text-xs sm:text-sm text-muted-foreground">
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
                    className={`h-8 min-w-8 px-2 text-xs sm:text-sm ${
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
              className="h-8 px-2 sm:px-3 text-xs sm:text-sm"
            >
              <span className="hidden sm:inline">Next</span>
              <ChevronRight className="w-4 h-4 sm:ml-1" />
            </Button>
          </div>
        </div>
      )}

      {/* Learner Details Modal */}
      <LearnerDetailsModal
        learner={selectedLearner}
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
      />
    </div>
  )
}
