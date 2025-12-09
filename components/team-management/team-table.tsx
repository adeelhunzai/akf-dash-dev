"use client"

import { PencilLine, UsersRound, Trash2, ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { useState } from "react"
import { useGetTeamsListQuery } from "@/lib/store/api/teamApi"
import { Skeleton } from "@/components/ui/skeleton"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import CreateTeamDialog from "./create-team-dialog"
import DeleteTeamDialog from "./delete-team-dialog"
import TeamMembersDialog from "./team-members-dialog"
import TeamDetailsDialog from "./team-details-dialog"
import type { Team } from "@/lib/types/team.types"


const getStatusBadgeColor = (status: string) => {
  return status === "Active" ? "text-[#00a63e]" : "text-[#991b1b]"
}

interface TeamTableProps {
  searchQuery: string
  statusFilter: string
}

export default function TeamTable({ searchQuery, statusFilter }: TeamTableProps) {
  const [currentPage, setCurrentPage] = useState(1)
  const [perPage, setPerPage] = useState(5)
  const [teamDetailsDialogOpen, setTeamDetailsDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [membersDialogOpen, setMembersDialogOpen] = useState(false)
  const [selectedTeam, setSelectedTeam] = useState<Team | undefined>(undefined)
  const [teamToEdit, setTeamToEdit] = useState<Team | undefined>(undefined)

  const { data, isLoading, isFetching } = useGetTeamsListQuery({
    page: currentPage,
    per_page: perPage,
    search: searchQuery,
    status: statusFilter,
  })

  const teams = data?.teams || []
  const pagination = data?.pagination

  const handleEditClick = (team: Team) => {
    setTeamToEdit(team)
    setEditDialogOpen(true)
  }

  const handleDeleteClick = (team: Team) => {
    setSelectedTeam(team)
    setDeleteDialogOpen(true)
  }

  const handleMembersClick = (team: Team) => {
    setSelectedTeam(team)
    setTeamDetailsDialogOpen(true)
  }

  const handleViewMembersFromDetails = () => {
    setTeamDetailsDialogOpen(false)
    if (selectedTeam) {
    setMembersDialogOpen(true)
    }
  }

  const handleEditTeamFromDetails = () => {
    setTeamDetailsDialogOpen(false)
    if (selectedTeam) {
      setTeamToEdit(selectedTeam)
      setEditDialogOpen(true)
    }
  }

  // Helper function to generate page numbers with ellipsis logic
  const getPageNumbers = () => {
    if (!pagination) return []
    const totalPages = pagination.total_pages
    const current = currentPage
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
      let start = Math.max(2, current - 1)
      let end = Math.min(totalPages - 1, current + 1)

      // Adjust if near beginning
      if (current <= 3) {
        start = 2
        end = 5
      }

      // Adjust if near end
      if (current >= totalPages - 2) {
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

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Team
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Facilitators
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Learners
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Progress
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Status
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Created
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {isLoading || isFetching ? (
              // Loading skeleton
              Array.from({ length: 5 }).map((_, index) => (
                <tr key={index} className="border-b border-border">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <Skeleton className="h-4 w-32" />
                    </div>
                  </td>
                  <td className="px-6 py-4"><Skeleton className="h-4 w-8" /></td>
                  <td className="px-6 py-4"><Skeleton className="h-4 w-8" /></td>
                  <td className="px-6 py-4"><Skeleton className="h-4 w-full max-w-xs" /></td>
                  <td className="px-6 py-4"><Skeleton className="h-6 w-16 rounded-full" /></td>
                  <td className="px-6 py-4"><Skeleton className="h-4 w-20" /></td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-8 w-8" />
                      <Skeleton className="h-8 w-8" />
                      <Skeleton className="h-8 w-8" />
                    </div>
                  </td>
                </tr>
              ))
            ) : teams.length > 0 ? (
              teams.map((team) => (
              <tr key={team.id} className="border-b border-border hover:bg-muted/30 transition-colors">
                {/* Team Column */}
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10 bg-[#00B140]">
                      <AvatarFallback className="text-white bg-[#00B140] font-semibold text-sm">{team.avatar}</AvatarFallback>
                    </Avatar>
                    <button
                      onClick={() => handleViewClick(team)}
                      className="font-medium text-foreground hover:text-[#16a34a] hover:underline cursor-pointer transition-colors text-left"
                    >
                      {team.name}
                    </button>
                  </div>
                </td>

                {/* Facilitators Column */}
                <td className="px-6 py-4 text-sm text-foreground font-medium">{team.facilitators}</td>

                {/* Members Column */}
                <td className="px-6 py-4">
                  <button
                    onClick={() => handleMembersClick(team)}
                    className="text-sm text-foreground font-medium hover:text-[#16a34a] hover:underline cursor-pointer transition-colors"
                  >
                    {team.members}
                  </button>
                </td>

                {/* Progress Column */}
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 max-w-xs bg-gray-200 rounded-full h-2">
                      <div className="bg-[#16a34a] h-2 rounded-full" style={{ width: `${team.progress}%` }}></div>
                    </div>
                    <span className="text-sm font-medium text-foreground">{team.progress}%</span>
                  </div>
                </td>

                {/* Status Column */}
                <td className="px-6 py-4">
                  <span className={`text-sm font-medium rounded-full px-3 py-0.5 ${team.status === "Inactive" ? "bg-[#fee2e2]" : "bg-[#dcfce7]"} ${getStatusBadgeColor(team.status)}`}>{team.status}</span>
                </td>

                {/* Created Column */}
                <td className="px-6 py-4 text-sm text-foreground">{team.created}</td>

                {/* Actions Column */}
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => handleEditClick(team)}>
                      <PencilLine className="w-4 h-4 text-[#2563EB] hover:text-foreground" />
                    </Button>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => handleMembersClick(team)}>
                      <UsersRound className="w-4 h-4 text-[#98D44E] hover:text-foreground" />
                    </Button>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => handleDeleteClick(team)}>
                      <Trash2 className="w-4 h-4 text-[#DC2626] hover:text-red-700" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))
            ) : (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center">
                  <p className="text-muted-foreground">No teams found matching your criteria.</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination && pagination.total_pages > 0 && (
        <div className="flex items-center justify-between px-6 py-4 border-t border-border">
          <div className="flex items-center gap-4">
            <div className="text-sm text-muted-foreground">
              Showing {((pagination.current_page - 1) * pagination.per_page) + 1} to{" "}
              {Math.min(pagination.current_page * pagination.per_page, pagination.total_items)} of{" "}
              {pagination.total_items} teams
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
              disabled={currentPage === 1 || isLoading || isFetching}
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
                    disabled={isLoading || isFetching}
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
              disabled={currentPage === pagination.total_pages || isLoading || isFetching}
              className="h-8"
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {selectedTeam && (
        <>
          <TeamDetailsDialog
            open={teamDetailsDialogOpen}
            onOpenChange={setTeamDetailsDialogOpen}
            team={selectedTeam}
            onViewMembers={handleViewMembersFromDetails}
            onEditTeam={handleEditTeamFromDetails}
          />
        <TeamMembersDialog
          open={membersDialogOpen}
          onOpenChange={setMembersDialogOpen}
            teamId={selectedTeam.id}
          teamName={selectedTeam.name}
          />
        </>
      )}

      <CreateTeamDialog 
        open={editDialogOpen} 
        onOpenChange={(open) => {
          setEditDialogOpen(open)
          if (!open) {
            setTeamToEdit(undefined)
          }
        }} 
        team={teamToEdit} 
      />
      <DeleteTeamDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen} team={selectedTeam} />
    </>
  )
}
