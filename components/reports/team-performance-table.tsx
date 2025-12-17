"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { useGetTeamReportQuery } from "@/lib/store/api/reportsApi"
import { Skeleton } from "@/components/ui/skeleton"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { TeamReportItem } from "@/lib/types/reports.types"

interface TeamPerformanceTableProps {
  searchQuery?: string;
  dateRange?: string;
  onVisibleRowsChange?: (rows: TeamReportItem[]) => void;
  onLoadingChange?: (loading: boolean) => void;
}

export function TeamPerformanceTable({ searchQuery = "", dateRange = "0", onVisibleRowsChange, onLoadingChange }: TeamPerformanceTableProps) {
  const [currentPage, setCurrentPage] = useState(1)
  const [perPage, setPerPage] = useState(10)

  // Convert dateRange to days
  const days = dateRange === "0" ? undefined : parseInt(dateRange)

  // Fetch data from API
  const { data, isLoading, isFetching, error } = useGetTeamReportQuery({
    page: currentPage,
    per_page: perPage,
    search: searchQuery || undefined,
  })

  // Reset to page 1 when search or date range changes
  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, dateRange])

  const teamsData = data?.data || []
  const previousTeamIds = useRef<string[]>([])
  const totalItems = data?.total || 0
  const totalPages = Math.ceil(totalItems / perPage)

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

  useEffect(() => {
    if (!onVisibleRowsChange) return

    const currentIds = teamsData.map((team) => team.id)
    const hasSameIds =
      currentIds.length === previousTeamIds.current.length &&
      currentIds.every((id, index) => id === previousTeamIds.current[index])

    if (hasSameIds) return

    previousTeamIds.current = currentIds
    onVisibleRowsChange(teamsData)
  }, [onVisibleRowsChange, teamsData])

  useEffect(() => {
    if (!onLoadingChange) return
    onLoadingChange(isLoading || isFetching)
  }, [isLoading, isFetching, onLoadingChange])

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-semibold text-foreground">Team Reports</h3>
        </div>
        <div className="p-8 text-center text-red-600">
          <p>Error loading team reports. Please try again later.</p>
        </div>
      </div>
    )
  }

  return (
    <div>
      {/* Table */}
      <div className="overflow-x-auto rounded-md border border-gray-200">
        <table className="w-full">
          <thead className="border-b border-gray-200" style={{ backgroundColor: '#F3F4F6' }}>
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600">TEAM</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600">MEMBERS</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600">AVG PROGRESS</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600">COMPLETION RATE</th>
            </tr>
          </thead>
          <tbody>
            {isLoading || isFetching ? (
              // Loading skeleton
              Array.from({ length: 5 }).map((_, index) => (
                <tr key={index} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <Skeleton className="h-4 w-32" />
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <Skeleton className="h-4 w-12" />
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-2 w-32 rounded-full" />
                      <Skeleton className="h-4 w-12" />
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <Skeleton className="h-4 w-12" />
                  </td>
                </tr>
              ))
            ) : teamsData.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                  No teams found
                </td>
              </tr>
            ) : (
              teamsData.map((team, index) => (
                <tr key={team.id} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-green-600 text-white flex items-center justify-center text-sm font-semibold">
                        {team.initials}
                      </div>
                      <span className="text-sm font-medium text-gray-900">{team.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-900">{team.members}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-32 bg-gray-200 rounded-full overflow-hidden">
                        <div className="h-full bg-green-600 rounded-full" style={{ width: `${team.avgProgress}%` }}></div>
                      </div>
                      <span className="text-sm text-gray-900">{team.avgProgress}%</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-900">{team.completionRate}%</span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {!isLoading && !error && totalItems > 0 && (
        <div className="flex items-center justify-between border-t border-gray-200 pt-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Rows per page:</span>
            <Select value={perPage.toString()} onValueChange={handlePerPageChange}>
              <SelectTrigger className="w-20 h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="25">25</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
              </SelectContent>
            </Select>
            <span className="text-sm text-gray-600">
              Showing {((currentPage - 1) * perPage) + 1} to {Math.min(currentPage * perPage, totalItems)} of {totalItems} teams
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1 || isLoading || isFetching}
              className="h-8"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <div className="flex items-center gap-1">
              {getPageNumbers().map((page, index) => (
                page === '...' ? (
                  <span key={`ellipsis-${index}`} className="px-2 text-gray-500">...</span>
                ) : (
                  <Button
                    key={page}
                    variant={currentPage === page ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCurrentPage(page as number)}
                    disabled={isLoading || isFetching}
                    className={`h-8 w-8 ${currentPage === page ? 'bg-green-600 text-white hover:bg-green-700' : ''}`}
                  >
                    {page}
                  </Button>
                )
              ))}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages || isLoading || isFetching}
              className="h-8"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
