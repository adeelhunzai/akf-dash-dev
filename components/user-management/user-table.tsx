"use client"

import { PencilLine, Eye, Trash2, ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import EditUserDialog from "./edit-user-dialog"
import DeleteUserDialog from "./delete-user-dialog"
import ViewUserDialog from "./view-user-dialog"
import { useState, useEffect, useMemo, useRef } from "react"
import { useGetUsersListQuery } from "@/lib/store/api/userApi"

export interface UserRow {
  id: string
  name: string
  email: string
  avatar: string
  avatarUrl?: string | null
  role: "Learner" | "Facilitator" | "Manager"
  team: string
  country: string
  teamsCount: number
  coursesCount: number
  status: "Active" | "Inactive"
  department: string
}

// Helper function to get initials from name
const getInitials = (name: string) => {
  const parts = name.trim().split(' ')
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  }
  return name.substring(0, 2).toUpperCase()
}

// Helper function to map WordPress roles to display roles
const mapRole = (roles: string[]): "Learner" | "Facilitator" | "Manager" => {
  if (roles.includes('group_leader')) return "Manager"
  if (roles.includes('group_leader_clone')) return "Facilitator"
  return "Learner"
}

// Helper function to check if avatar URL is a Gravatar default
const isGravatarDefault = (url: string) => {
  return url.includes('secure.gravatar.com') && (url.includes('d=mm') || url.includes('d=blank'))
}

// Skeleton loader for table rows
function TableRowSkeleton() {
  return (
    <tr className="border-b border-border">
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-48" />
          </div>
        </div>
      </td>
      <td className="px-6 py-4">
        <Skeleton className="h-6 w-20 rounded-full" />
      </td>
      <td className="px-6 py-4">
        <Skeleton className="h-4 w-40" />
      </td>
      <td className="px-6 py-4">
        <Skeleton className="h-4 w-8" />
      </td>
      <td className="px-6 py-4">
        <Skeleton className="h-4 w-8" />
      </td>
      <td className="px-6 py-4">
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-8 rounded" />
          <Skeleton className="h-8 w-8 rounded" />
          <Skeleton className="h-8 w-8 rounded" />
        </div>
      </td>
    </tr>
  )
}

const getRoleBadgeColor = (role: string) => {
  switch (role) {
    case "Learner":
      return "bg-[#DBEAFE] text-[#1E40AF]"
    case "Facilitator":
      return "bg-[#DCFCE7] text-[#166534]"
    case "Manager":
      return "bg-[#F3E8FF] text-[#6B21A8]"
    default:
      return "bg-gray-100 text-gray-700"
  }
}

interface UserTableProps {
  searchQuery: string
  roleFilter: string
  statusFilter: string
  onVisibleRowsChange?: (rows: UserRow[]) => void
}

export default function UserTable({ searchQuery, roleFilter, statusFilter, onVisibleRowsChange }: UserTableProps) {
  const [currentPage, setCurrentPage] = useState(1)
  const [perPage, setPerPage] = useState(5)
  const [debouncedSearch, setDebouncedSearch] = useState(searchQuery)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [viewDialogOpen, setViewDialogOpen] = useState(false)
  const [selectedUserId, setSelectedUserId] = useState<number | undefined>(undefined)
  const [selectedUser, setSelectedUser] = useState<UserRow | undefined>(undefined)

  // Debounce search query - wait 500ms after user stops typing
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery)
    }, 500)

    return () => clearTimeout(timer)
  }, [searchQuery])

  // Fetch users from API with debounced search and role filters
  const { data, isLoading, isFetching, isError } = useGetUsersListQuery({ 
    page: currentPage,
    per_page: perPage,
    search: debouncedSearch,
    role: roleFilter
  })

  // Reset to page 1 when search or role filter changes
  useEffect(() => {
    setCurrentPage(1)
  }, [debouncedSearch, roleFilter])

  // Transform API data to match User interface
  // No client-side filtering needed as API handles it
  const users: UserRow[] = useMemo(
    () =>
      data?.users.map((user) => ({
        id: user.ID.toString(),
        name: user.display_name,
        email: user.user_email,
        avatar: getInitials(user.display_name),
        avatarUrl: isGravatarDefault(user.avatar_url) ? null : user.avatar_url,
        role: mapRole(user.roles),
        team: user.teams.length > 0 ? user.teams.join(', ') : 'Unassigned',
        country: '', // Not available in API
        teamsCount: user.team_count,
        coursesCount: user.courses_enrolled,
        status: "Active", // Default status since not in API
        department: '', // Not available in API
      })) || [],
    [data]
  )

  const previousUsersRef = useRef<UserRow[]>([])

  useEffect(() => {
    if (!onVisibleRowsChange) return

    const hasSameIds =
      previousUsersRef.current.length === users.length &&
      users.every((row, index) => row.id === previousUsersRef.current[index]?.id)

    if (hasSameIds) return

    previousUsersRef.current = users
    onVisibleRowsChange(users)
  }, [users, onVisibleRowsChange])

  const handleEditClick = (userId: number) => {
    setSelectedUserId(userId)
    setEditDialogOpen(true)
  }

  const handleDeleteClick = (user: UserRow) => {
    setSelectedUser(user)
    setDeleteDialogOpen(true)
  }

  const handleViewClick = (userId: number) => {
    setSelectedUserId(userId)
    setViewDialogOpen(true)
  }


  // Helper function to generate page numbers with ellipsis logic
  const getPageNumbers = () => {
    if (!data) return []
    const totalPages = data.total_pages
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
                User
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Role
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Team
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Teams
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Courses
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {isFetching ? (
              Array.from({ length: 5 }).map((_, index) => (
                <TableRowSkeleton key={index} />
              ))
            ) : isError ? (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center">
                  <p className="text-destructive">Failed to load users</p>
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center">
                  <p className="text-muted-foreground">No users found matching your criteria.</p>
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <tr key={user.id} className="border-b border-border hover:bg-muted/30 transition-colors">
                  {/* User Column */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10 bg-[#00B140]">
                        {user.avatarUrl && <AvatarImage src={user.avatarUrl} />}
                        <AvatarFallback className="text-white bg-[#00B140] font-semibold">{user.avatar}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-foreground">{user.name}</p>
                        <p className="text-xs text-muted-foreground">{user.email}</p>
                      </div>
                    </div>
                  </td>

                  {/* Role Column */}
                  <td className="px-6 py-4">
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getRoleBadgeColor(user.role)}`}
                    >
                      {user.role}
                    </span>
                  </td>

                  {/* Team Column */}
                  <td className="px-6 py-4 text-sm text-foreground max-w-xs truncate">{user.team}</td>

                  {/* Teams Count */}
                  <td className="px-6 py-4 text-sm text-foreground font-medium">{user.teamsCount}</td>

                  {/* Courses Count */}
                  <td className="px-6 py-4 text-sm text-foreground font-medium">{user.coursesCount}</td>

                  {/* Actions Column */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => handleEditClick(parseInt(user.id))}>
                        <PencilLine className="w-4 h-4 text-[#2563EB] hover:text-foreground" />
                      </Button>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => handleViewClick(parseInt(user.id))}>
                        <Eye className="w-4 h-4 text-[#98D44E] hover:text-foreground" />
                      </Button>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => handleDeleteClick(user)}>
                        <Trash2 className="w-4 h-4 text-[#DC2626] hover:text-red-700" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {data && data.total_pages > 0 && (
        <div className="flex items-center justify-between px-6 py-4 border-t border-border">
          <div className="flex items-center gap-4">
            <div className="text-sm text-muted-foreground">
              Showing {((data.current_page - 1) * perPage) + 1} to{" "}
              {Math.min(data.current_page * perPage, data.total_users)} of{" "}
              {data.total_users} users
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
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1 || isFetching}
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
                    disabled={isFetching}
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
              onClick={() => setCurrentPage(prev => Math.min(data.total_pages, prev + 1))}
              disabled={currentPage === data.total_pages || isFetching}
              className="h-8"
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      <ViewUserDialog
        open={viewDialogOpen}
        onOpenChange={setViewDialogOpen}
        userId={selectedUserId}
        onEditClick={() => {
          setViewDialogOpen(false)
          setEditDialogOpen(true)
        }}
      />
      <EditUserDialog open={editDialogOpen} onOpenChange={setEditDialogOpen} userId={selectedUserId} />
      <DeleteUserDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        user={selectedUser}
      />
    </>
  )
}
