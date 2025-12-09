"use client"

import { useState, useEffect } from "react"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { useGetUserDetailsQuery, useUpdateUserMutation } from "@/lib/store/api/userApi"
import { Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface EditUserDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  userId?: number
}

// Helper function to map WordPress roles to display roles
const mapRole = (roles: string[]): string => {
  if (roles.includes('group_leader')) return "Manager"
  if (roles.includes('group_leader_clone')) return "Facilitator"
  return "Learner"
}

// Helper function to map display role to WordPress role
const mapToWordPressRole = (role: string): string => {
  if (role === "Manager") return "group_leader"
  if (role === "Facilitator") return "group_leader_clone"
  return "subscriber"
}

export default function EditUserDialog({ open, onOpenChange, userId }: EditUserDialogProps) {
  const { toast } = useToast()
  const { data: userDetails, isLoading, isFetching } = useGetUserDetailsQuery(userId!, {
    skip: !userId || !open,
  })
  const [updateUser, { isLoading: isUpdating }] = useUpdateUserMutation()
  const [currentUserId, setCurrentUserId] = useState<number | undefined>(undefined)

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    role: "Learner",
    organization: "",
  })

  // Track userId changes
  useEffect(() => {
    if (userId !== currentUserId) {
      setCurrentUserId(userId)
      // Reset form when userId changes
      setFormData({
        name: "",
        email: "",
        role: "Learner",
        organization: "",
      })
    }
  }, [userId, currentUserId])

  // Update form data when user details are loaded
  useEffect(() => {
    if (userDetails && userId === currentUserId) {
      setFormData({
        name: userDetails.display_name,
        email: userDetails.user_email,
        role: mapRole(userDetails.roles),
        organization: userDetails.organization || "",
      })
    }
  }, [userDetails, userId, currentUserId])
  
  // Reset form when modal closes
  useEffect(() => {
    if (!open) {
      setFormData({
        name: "",
        email: "",
        role: "Learner",
        organization: "",
      })
      setCurrentUserId(undefined)
    }
  }, [open])

  const handleSave = async () => {
    if (!userId) return

    try {
      await updateUser({
        userId,
        display_name: formData.name,
        email: formData.email,
        role: mapToWordPressRole(formData.role),
        organization: formData.organization,
      }).unwrap()

      toast({
        title: "Success",
        description: "User updated successfully",
      })
      onOpenChange(false)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update user",
        variant: "destructive",
      })
    }
  }

  const handleCancel = () => {
    onOpenChange(false)
  }

  if (!userId) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader className="flex items-center justify-between mb-6">
          <DialogTitle className="text-xl font-bold">Edit User</DialogTitle>
    
        </DialogHeader>

        {isLoading || isFetching || !formData.name ? (
          <div className="space-y-4">
            {/* Full Name Skeleton */}
            <div>
              <Skeleton className="h-4 w-20 mb-2" />
              <Skeleton className="h-10 w-full" />
            </div>
            {/* Email Skeleton */}
            <div>
              <Skeleton className="h-4 w-24 mb-2" />
              <Skeleton className="h-10 w-full" />
            </div>
            {/* Role Skeleton */}
            <div>
              <Skeleton className="h-4 w-16 mb-2" />
              <Skeleton className="h-10 w-full" />
            </div>
            {/* Organization Skeleton */}
            <div>
              <Skeleton className="h-4 w-32 mb-2" />
              <Skeleton className="h-10 w-full" />
            </div>
          </div>
        ) : (
        <div className="space-y-4">
          {/* Full Name */}
          <div>
            <Label htmlFor="fullName" className="text-sm font-medium text-foreground mb-2 block">
              Full Name
            </Label>
            <Input
              id="fullName"
              placeholder="Enter full name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="border border-input rounded-md"
              disabled={isLoading || isUpdating}
            />
          </div>

          {/* Email Address */}
          <div>
            <Label htmlFor="email" className="text-sm font-medium text-foreground mb-2 block">
              Email Address
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="Enter email address"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="border border-input rounded-md"
              disabled={isLoading || isUpdating}
            />
          </div>

          {/* Role */}
          <div>
            <Label htmlFor="role" className="text-sm font-medium text-foreground mb-2 block">
              Role
            </Label>
            <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value })} disabled={isLoading || isUpdating}>
              <SelectTrigger id="role" className="border border-input rounded-md">
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Learner">Learner</SelectItem>
                <SelectItem value="Facilitator">Facilitator</SelectItem>
                <SelectItem value="Manager">Manager</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Organization */}
          <div>
            <Label htmlFor="organization" className="text-sm font-medium text-foreground mb-2 block">
              Organization <span className="text-muted-foreground text-xs">(Optional)</span>
            </Label>
            <Input
              id="organization"
              placeholder="Enter organization"
              value={formData.organization}
              onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
              className="border border-input rounded-md"
              disabled={isLoading || isUpdating}
            />
          </div>
        </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 mt-6 pt-4 border-t border-border">
          <Button
            variant="outline"
            className="flex-1 border-input text-foreground hover:bg-muted bg-transparent"
            onClick={handleCancel}
            disabled={isUpdating}
          >
            Cancel
          </Button>
          <Button 
            className="flex-1 bg-[#16a34a] text-white hover:bg-[#15803d]" 
            onClick={handleSave}
            disabled={isLoading || isUpdating}
          >
            {isUpdating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Changes"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
