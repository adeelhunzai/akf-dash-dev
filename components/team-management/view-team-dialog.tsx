"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Edit2 } from "lucide-react"

interface Team {
  id: string
  name: string
  avatar: string
  facilitators: number
  members: number
  progress: number
  status: "Active" | "Inactive"
  created: string
}

interface ViewTeamDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  team?: Team
}

export default function ViewTeamDialog({ open, onOpenChange, team }: ViewTeamDialogProps) {
  if (!team) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Team Details</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Team Header */}
          <div className="flex items-start gap-4">
            <Avatar className="h-16 w-16 bg-[#16a34a] flex-shrink-0">
              <AvatarFallback className="text-white font-semibold text-lg">{team.avatar}</AvatarFallback>
            </Avatar>
            <div>
              <h3 className="text-lg font-bold text-foreground">{team.name}</h3>
              <span
                className={`inline-block text-sm font-medium ${
                  team.status === "Active" ? "text-green-600" : "text-red-600"
                }`}
              >
                {team.status}
              </span>
            </div>
          </div>

          {/* Team Information */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">Facilitators</p>
              <p className="text-lg font-semibold text-foreground">{team.facilitators}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">Members</p>
              <p className="text-lg font-semibold text-foreground">{team.members}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">Progress</p>
              <p className="text-lg font-semibold text-foreground">{team.progress}%</p>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">Created</p>
              <p className="text-lg font-semibold text-foreground">{team.created}</p>
            </div>
          </div>

          {/* Progress Bar */}
          <div>
            <p className="text-sm font-medium text-foreground mb-2">Overall Progress</p>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div className="bg-[#16a34a] h-3 rounded-full" style={{ width: `${team.progress}%` }}></div>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1 bg-transparent">
              <Edit2 className="w-4 h-4 mr-2" />
              Edit Team
            </Button>
            <Button variant="outline" className="flex-1 bg-transparent" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
