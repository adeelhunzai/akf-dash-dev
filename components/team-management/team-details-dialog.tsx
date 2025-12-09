"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { UsersRound, PencilLine, UserRound, Users, BarChart3, Info } from "lucide-react"
import { useGetTeamDetailsQuery } from "@/lib/store/api/teamApi"
import { Skeleton } from "@/components/ui/skeleton"
import type { Team } from "@/lib/types/team.types"

interface TeamDetailsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  team: Team | undefined
  onViewMembers: () => void
  onEditTeam: () => void
}

// Helper function to get initials from name
const getInitials = (name: string): string => {
  const parts = name.trim().split(/\s+/)
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase()
  }
  return name.substring(0, 2).toUpperCase()
}

// Helper function to format date
const formatDate = (dateString: string): string => {
  try {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })
  } catch {
    return dateString
  }
}

// Component to display facilitator avatar and name
function FacilitatorItem({ facilitator, index }: { facilitator: { id: number; display_name: string; avatar_url: string }; index: number }) {
  const initials = getInitials(facilitator.display_name)
  const avatarColors = [
    '#3B82F6', // Blue
    '#A855F7', // Purple
    '#F97316', // Orange
  ]
  const colorIndex = index % avatarColors.length
  const bgColor = avatarColors[colorIndex]

  return (
    <div 
      className="flex items-center gap-2.5 flex-shrink-0 rounded-lg px-3 py-2 border"
      style={{ 
        backgroundColor: '#F9FAFB',
        borderColor: '#E5E7EB'
      }}
    >
      <Avatar className="w-10 h-10 text-white flex-shrink-0" style={{ backgroundColor: bgColor }}>
        <AvatarFallback className="text-white text-sm font-medium" style={{ backgroundColor: bgColor }}>
          {initials}
        </AvatarFallback>
      </Avatar>
      <p className="text-sm font-medium text-gray-900 whitespace-nowrap">{facilitator.display_name}</p>
    </div>
  )
}

export default function TeamDetailsDialog({ 
  open, 
  onOpenChange, 
  team, 
  onViewMembers, 
  onEditTeam 
}: TeamDetailsDialogProps) {
  const { data: teamDetails, isLoading, isFetching } = useGetTeamDetailsQuery(team?.id || 0, { skip: !team?.id || !open })

  if (!team) {
    return null
  }

  // Check if we're loading or if the team details don't match the current team
  const isDataLoading = isLoading || isFetching || !teamDetails || teamDetails.team?.id !== team.id
  
  const teamInitials = team.avatar || getInitials(team.name)
  const facilitators = isDataLoading ? [] : (teamDetails?.team?.facilitators || [])
  const facilitatorIds = isDataLoading ? [] : (teamDetails?.team?.facilitator_ids || [])
  const progress = isDataLoading ? 0 : (team.progress || 0)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="!max-w-2xl w-[90vw] sm:w-[85vw] max-h-[90vh] overflow-hidden p-0 gap-0 flex flex-col">
        <DialogHeader 
          className="p-4 pb-3 border-b border-border flex-shrink-0"
          style={{ 
            background: 'linear-gradient(to right, #F0FDF4 0%, #EFF6FF 100%)'
          }}
        >
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <Avatar className="w-12 h-12 bg-green-500 text-white flex-shrink-0">
                <AvatarFallback className="bg-green-500 text-white text-base font-semibold">
                  {teamInitials}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <DialogTitle className="text-lg font-semibold text-gray-900 mb-1.5 truncate">
                  {team.name}
                </DialogTitle>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs text-gray-500">
                    Created: {formatDate(team.created)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </DialogHeader>

        <div className="p-4 space-y-4 overflow-y-auto flex-1">
          {/* Statistics Cards */}
          <div className="grid grid-cols-3 gap-2.5">
            {/* Facilitators Card */}
            <div className="border border-gray-200 rounded-lg p-3" style={{ backgroundColor: '#DBEAFE' }}>
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-xs font-medium text-blue-600 mb-1.5">Facilitators</p>
                  {isDataLoading ? (
                    <Skeleton className="h-6 w-10" />
                  ) : (
                    <p className="text-xl font-bold text-blue-600">{facilitatorIds.length}</p>
                  )}
                </div>
                <div className="w-10 h-10 rounded flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)' }}>
                  <UserRound className="w-5 h-5 text-blue-500" />
                </div>
              </div>
            </div>

            {/* Members Card */}
            <div className="border border-gray-200 rounded-lg p-3" style={{ backgroundColor: '#F0FDF4' }}>
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-xs font-medium text-green-600 mb-1.5">Members</p>
                  {isDataLoading ? (
                    <Skeleton className="h-6 w-10" />
                  ) : (
                    <p className="text-xl font-bold text-green-600">{team.members}</p>
                  )}
                </div>
                <div className="w-10 h-10 rounded flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'rgba(34, 197, 94, 0.1)' }}>
                  <Users className="w-5 h-5 text-green-500" />
                </div>
              </div>
            </div>

            {/* Progress Card */}
            <div className="border border-gray-200 rounded-lg p-3" style={{ backgroundColor: '#FAF5FF' }}>
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-xs font-medium text-purple-600 mb-1.5">Progress</p>
                  {isDataLoading ? (
                    <Skeleton className="h-6 w-10" />
                  ) : (
                    <p className="text-xl font-bold text-purple-600">{progress}%</p>
                  )}
                </div>
                <div className="w-10 h-10 rounded flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'rgba(168, 85, 247, 0.1)' }}>
                  <BarChart3 className="w-5 h-5 text-purple-500" />
                </div>
              </div>
            </div>
          </div>

          {/* Overall Team Progress */}
          <div className="bg-white rounded-lg p-3">
            <h3 className="text-sm font-semibold text-gray-900 mb-2">Overall Team Progress</h3>
            {isDataLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-2.5 w-full rounded-full" />
                <Skeleton className="h-4 w-10 ml-auto" />
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <div className="flex-1 h-2.5 rounded-full overflow-hidden" style={{ backgroundColor: '#E5E7EB' }}>
                  <div 
                    className="h-full transition-all"
                    style={{ 
                      width: `${progress}%`,
                      background: 'linear-gradient(to right, #22C55E 0%, #16A34A 100%)'
                    }}
                  />
                </div>
                <span className="text-sm font-semibold text-gray-900 whitespace-nowrap">{progress}%</span>
              </div>
            )}
          </div>

          {/* Team Facilitators */}
          <div className="bg-white rounded-lg p-3">
            <div className="flex items-center gap-2 mb-3">
              <UserRound className="w-4 h-4 text-gray-600 flex-shrink-0" />
              <h3 className="text-sm font-semibold text-gray-900">Team Facilitators</h3>
            </div>
            {isDataLoading ? (
              <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-hide">
                {Array.from({ length: 3 }).map((_, index) => (
                  <div key={index} className="flex items-center gap-2.5 flex-shrink-0">
                    <Skeleton className="w-10 h-10 rounded-full" />
                    <Skeleton className="h-4 w-16" />
                  </div>
                ))}
              </div>
            ) : facilitators.length > 0 ? (
              <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-hide">
                {facilitators.map((facilitator, index) => (
                  <FacilitatorItem key={facilitator.id} facilitator={facilitator} index={index} />
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-500">No facilitators assigned</p>
            )}
          </div>

          {/* Team Information */}
          <div className="rounded-lg p-3 border" style={{ backgroundColor: '#F9FAFB', borderColor: '#E5E7EB' }}>
            <div className="flex items-center gap-2 mb-3">
              <Info className="w-4 h-4 text-gray-600 flex-shrink-0" />
              <h3 className="text-sm font-semibold text-gray-900">Team Information</h3>
            </div>
            {isDataLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, index) => (
                  <div key={index} className="flex items-center justify-between gap-2">
                    <Skeleton className="h-3 w-20" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs text-gray-600">Team ID:</span>
                  <span className="text-xs font-medium text-gray-900">{teamInitials}</span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs text-gray-600">Created Date:</span>
                  <span className="text-xs font-medium text-gray-900">{formatDate(team.created)}</span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs text-gray-600">Total Members:</span>
                  <span className="text-xs font-medium text-gray-900">{team.members} members</span>
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2.5 pt-3 border-t border-border flex-shrink-0">
            <Button
              onClick={onViewMembers}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-sm h-9"
            >
              <UsersRound className="w-3.5 h-3.5 mr-1.5" />
              View Members
            </Button>
            <Button
              onClick={onEditTeam}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white text-sm h-9"
            >
              <PencilLine className="w-3.5 h-3.5 mr-1.5" />
              Edit Team
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

