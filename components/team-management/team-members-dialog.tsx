"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Trash2, Search, Loader2 } from "lucide-react"
import { useState, useMemo } from "react"
import { useGetTeamMembersQuery, useRemoveMemberFromTeamMutation } from "@/lib/store/api/teamApi"
import { useToast } from "@/hooks/use-toast"
import { Skeleton } from "@/components/ui/skeleton"
import type { TeamMember } from "@/lib/types/team.types"

interface TeamMembersDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  teamId: number
  teamName: string
}

const getRoleBadgeColor = (role: string) => {
  switch (role) {
    case "Learner":
      return "bg-blue-100 text-blue-700"
    case "Facilitator":
      return "bg-green-100 text-green-700"
    case "Manager":
      return "bg-purple-100 text-purple-700"
    default:
      return "bg-gray-100 text-gray-700"
  }
}

const getStatusColor = (status: string) => {
  return status === "Active" ? "text-green-600" : "text-red-600"
}

export default function TeamMembersDialog({ open, onOpenChange, teamId, teamName }: TeamMembersDialogProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [removingUserId, setRemovingUserId] = useState<number | null>(null)
  const { toast } = useToast()
  const { data, isLoading, isError } = useGetTeamMembersQuery(teamId, { skip: !open })
  const [removeMember] = useRemoveMemberFromTeamMutation()

  const members = data?.members || []

  // Reset state when dialog closes
  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setSearchQuery("")
      setRemovingUserId(null)
    }
    onOpenChange(newOpen)
  }

  const filteredMembers = useMemo(() => {
    return members.filter(
      (member) =>
        member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        member.email.toLowerCase().includes(searchQuery.toLowerCase()),
    )
  }, [members, searchQuery])

  const handleRemoveMember = async (userId: number, userName: string) => {
    setRemovingUserId(userId)
    try {
      await removeMember({ teamId, userId }).unwrap()
      toast({
        title: "Success",
        description: `${userName} removed from team successfully`,
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.data?.message || "Failed to remove member",
        variant: "destructive"
      })
    } finally {
      setRemovingUserId(null)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-[95vw] lg:max-w-7xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            {teamName} - Team Member
            <p className="text-sm font-normal text-muted-foreground mt-1">
              Total: {isLoading ? "..." : members.length} members
            </p>
          </DialogTitle>
        </DialogHeader>

        {/* Search Bar */}
        <div className="px-6 pt-4 pb-4 border-b">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search learner by name or email"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
              disabled={isLoading}
            />
          </div>
        </div>

        {/* Members Table */}
        <div className="overflow-x-auto flex-1">
          {isLoading ? (
            <div className="p-8">
              <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, index) => (
                  <div key={index} className="flex items-center gap-4">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="flex-1">
                      <Skeleton className="h-4 w-32 mb-2" />
                      <Skeleton className="h-3 w-48" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : isError ? (
            <div className="flex items-center justify-center py-12">
              <p className="text-destructive">Failed to load team members</p>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Member
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Email
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Role
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Join Date
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Last Activity
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredMembers.length > 0 ? (
                  filteredMembers.map((member, index) => (
                    <tr key={member.id} className="border-b border-border hover:bg-muted/30 transition-colors">
                      {/* Member Column */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10 bg-[#00B140]">
                            <AvatarFallback className="text-white bg-[#00B140] font-semibold text-sm">{member.avatar}</AvatarFallback>
                          </Avatar>
                          <span className="font-medium text-foreground">{member.name}</span>
                        </div>
                      </td>

                      {/* Email Column */}
                      <td className="px-6 py-4 text-sm text-foreground">{member.email}</td>

                      {/* Role Column */}
                      <td className="px-6 py-4">
                        <span
                          className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getRoleBadgeColor(member.role)}`}
                        >
                          {member.role}
                        </span>
                      </td>

                      {/* Join Date Column */}
                      <td className="px-6 py-4 text-sm text-foreground">{member.joinDate}</td>

                      {/* Last Activity Column */}
                      <td className="px-6 py-4 text-sm text-foreground">{member.lastActivity}</td>

                      {/* Status Column */}
                      <td className="px-6 py-4">
                        <span className={`text-sm font-medium ${getStatusColor(member.status)}`}>{member.status}</span>
                      </td>

                      {/* Actions Column */}
                      <td className="px-6 py-4">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 w-8 p-0"
                          onClick={() => handleRemoveMember(member.id, member.name)}
                          disabled={removingUserId === member.id}
                          title="Remove from team"
                        >
                          {removingUserId === member.id ? (
                            <Loader2 className="w-4 h-4 text-[#DC2626] animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4 text-[#DC2626]" />
                          )}
                        </Button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-muted-foreground">
                      No members found matching your search.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
