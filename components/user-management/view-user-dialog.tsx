"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"
import { Edit2, Clock } from "lucide-react"
import { useGetUserDetailsQuery } from "@/lib/store/api/userApi"

interface ViewUserDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  userId?: number
  onEditClick?: () => void
}

// Helper function to check if avatar URL is a Gravatar default
const isGravatarDefault = (url: string) => {
  return url.includes('secure.gravatar.com') && (url.includes('d=mm') || url.includes('d=blank'))
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
// Correct mappings: group_leader = Facilitator, group_leader_clone = Manager
const mapRole = (roles: string[]): string => {
  if (roles.includes('group_leader')) return "Facilitator"
  if (roles.includes('group_leader_clone')) return "Manager"
  return "Learner"
}

export default function ViewUserDialog({ open, onOpenChange, userId, onEditClick }: ViewUserDialogProps) {
  // Fetch user details from API
  const { data: userDetails, isLoading, isError } = useGetUserDetailsQuery(userId!, {
    skip: !userId || !open,
  })

  if (!userId) return null

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

  const getStatusBadgeColor = (status: string) => {
    return status === "Active" 
      ? "bg-[#dcfce7] text-[#00a63e]" 
      : "bg-[#fee2e2] text-[#991b1b]"
  }

  const role = userDetails ? mapRole(userDetails.roles) : ""
  const avatarUrl = userDetails && !isGravatarDefault(userDetails.avatar_url) ? userDetails.avatar_url : null
  const initials = userDetails ? getInitials(userDetails.display_name) : ""

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">User Details</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="space-y-6 py-4">
            <div className="flex items-start gap-4">
              <Skeleton className="h-20 w-20 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-4 w-64" />
                <div className="flex gap-2">
                  <Skeleton className="h-6 w-20 rounded-full" />
                  <Skeleton className="h-6 w-20 rounded-full" />
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-6">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          </div>
        ) : isError ? (
          <div className="py-8 text-center">
            <p className="text-destructive">Failed to load user details</p>
          </div>
        ) : userDetails ? (
          <div className="space-y-6 py-4">
            {/* User Header */}
            <div className="flex items-start gap-4">
              <Avatar className="h-20 w-20 bg-[#00B140]">
                {avatarUrl && <AvatarImage src={avatarUrl} />}
                <AvatarFallback className="text-white text-2xl font-semibold bg-[#00B140]">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-foreground mb-1">{userDetails.display_name}</h3>
                <p className="text-sm text-muted-foreground mb-3">{userDetails.user_email}</p>
                <div className="flex items-center gap-2">
                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getRoleBadgeColor(role)}`}>
                    {role}
                  </span>
                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getStatusBadgeColor(userDetails.account_status)}`}>
                    {userDetails.account_status}
                  </span>
                </div>
              </div>
            </div>

            {/* User Details Grid */}
            <div className="grid grid-cols-2 gap-6 py-4 border-t border-border">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Organisation</p>
                <p className="text-base font-semibold text-foreground">{userDetails.organization}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Last Login</p>
                <p className="text-base font-semibold text-foreground">
                  {userDetails.last_login || 'Never'}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Total Courses</p>
                <p className="text-base font-semibold text-foreground">{userDetails.total_courses} courses</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Completed Courses</p>
                <p className="text-base font-semibold text-foreground">{userDetails.completed_courses} courses</p>
              </div>
            </div>

            {/* Activity Information */}
            <div className="space-y-3 bg-muted/30 rounded-lg p-4 border border-border">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-semibold text-foreground">Activity Information</span>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Days Since Last Login:</span>
                  <span className="font-semibold text-foreground">
                    {userDetails.days_since_login !== null ? `${userDetails.days_since_login} days` : 'Never logged in'}
                  </span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  onEditClick?.()
                  onOpenChange(false)
                }}
                className="flex-1 bg-[#16a34a] hover:bg-[#15803d] text-white"
              >
                <Edit2 className="w-4 h-4 mr-2" />
                Edit User
              </Button>
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}
