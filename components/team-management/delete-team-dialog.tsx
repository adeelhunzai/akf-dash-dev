"use client"

import { AlertTriangle, Loader2, AlertCircle } from "lucide-react"
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { useDeleteTeamMutation } from "@/lib/store/api/teamApi"
import { useToast } from "@/hooks/use-toast"
import type { Team } from "@/lib/types/team.types"

interface DeleteTeamDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  team?: Team
}

export default function DeleteTeamDialog({ open, onOpenChange, team }: DeleteTeamDialogProps) {
  const [deleteTeam, { isLoading }] = useDeleteTeamMutation()
  const { toast } = useToast()

  const handleDelete = async () => {
    if (!team) return

    try {
      const result = await deleteTeam({ teamId: team.id }).unwrap()
      
      toast({
        title: "Success",
        description: result.message || "Team deleted successfully",
      })
      
      onOpenChange(false)
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.data?.message || "Failed to delete team",
        variant: "destructive"
      })
    }
  }

  // Helper function to get initials from team name
  const getInitials = (name: string): string => {
    const parts = name.trim().split(/\s+/)
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase()
    }
    return name.substring(0, 2).toUpperCase()
  }

  const teamInitials = team?.avatar || (team?.name ? getInitials(team.name) : '')

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md">
        {/* Warning Icon */}
        <div className="flex justify-center pt-4 pb-2">
          <AlertTriangle className="w-12 h-12 text-red-600" />
        </div>

        {/* Header */}
        <AlertDialogHeader className="text-center">
          <AlertDialogTitle className="text-2xl font-bold">Delete Team</AlertDialogTitle>
          <AlertDialogDescription className="text-base text-foreground pt-2">
            Are you sure you want to delete this team? This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>

        {/* Team Card */}
        {team && (
          <div className="flex items-center gap-3 p-4 rounded-lg" style={{ backgroundColor: '#F9FAFB' }}>
            <div className="h-12 w-12 rounded-lg bg-green-500 flex items-center justify-center flex-shrink-0">
              <span className="text-white font-semibold text-base">{teamInitials}</span>
            </div>
            <div className="flex-1">
              <p className="font-semibold text-gray-900">{team.name}</p>
              <p className="text-sm text-gray-600">{team.members} members · {team.facilitators} facilitators</p>
            </div>
          </div>
        )}

        {/* Warning Box */}
        <div className="flex items-start gap-3 p-3 rounded-lg" style={{ backgroundColor: '#FEF2F2' }}>
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-gray-900">
            All team data, member assignments, and progress will be permanently deleted.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-2">
          <AlertDialogCancel className="flex-1 border-border bg-gray-100 hover:bg-gray-200 text-gray-900" disabled={isLoading}>
            Cancel
          </AlertDialogCancel>
          <Button 
            onClick={handleDelete} 
            className="flex-1 bg-red-600 hover:bg-red-700 text-white"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Deleting...
              </>
            ) : (
              "Delete Team"
            )}
          </Button>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  )
}
